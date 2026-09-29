import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

// HU-003: escenarios de specs/actualizacion-producto/spec.md contra el backend real.
// Cada prueba crea su propio producto por API y edita ese producto: nunca modifica los productos
// sembrados que usan las pruebas de la HU-001.

const RUN = Date.now().toString(36).toUpperCase();
let counter = 0;

interface CreatedProduct {
  id: number;
  sku: string;
  name: string;
}

async function createProduct(request: APIRequestContext): Promise<CreatedProduct> {
  counter += 1;
  const sku = `UPD-${RUN}-${counter}`;
  const name = `Manguera ${RUN} ${counter}`;
  const response = await request.post('/api/products', {
    data: { sku, name, quantity: '10', price: '2500' },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as CreatedProduct;
}

const rows = (page: Page) => page.locator('table.product-table tbody tr');
const form = (page: Page) => page.getByRole('region', { name: 'Editar producto' });

async function openEdit(page: Page, product: CreatedProduct) {
  await page.getByLabel('Buscar por nombre o SKU').fill(product.sku);
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole('button', { name: `Editar ${product.name}` }).click();
  await expect(form(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(rows(page).filter({ hasText: 'Filtro Aceite' })).toHaveCount(1);
});

test('editar un producto conserva el filtro y actualiza la fila', async ({ page, request }) => {
  const product = await createProduct(request);
  await openEdit(page, product);

  const sku = form(page).getByLabel('SKU', { exact: true });
  await expect(sku).toHaveValue(product.sku);
  await expect(sku).toHaveJSProperty('readOnly', true);
  await expect(form(page).getByLabel('Cantidad en stock')).toHaveValue('10');
  await expect(form(page).getByLabel('Precio unitario')).toHaveValue('2500');

  const newName = `${product.name} Reforzada`;
  await form(page).getByLabel('Nombre', { exact: true }).fill(newName);
  await form(page).getByLabel('Cantidad en stock').fill('7');
  await form(page).getByLabel('Precio unitario').fill('3100,50');
  await form(page).getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText(`Producto ${newName} actualizado correctamente`)).toBeVisible();
  await expect(form(page)).toBeHidden();
  await expect(page.getByLabel('Buscar por nombre o SKU')).toHaveValue(product.sku);
  await expect(rows(page).locator('td')).toHaveText([product.sku, newName, '7', '3.100,50', 'Editar']);
});

test('validación de cantidad y precio', async ({ page, request }) => {
  const product = await createProduct(request);
  await openEdit(page, product);

  await form(page).getByLabel('Cantidad en stock').fill('2.5');
  await form(page).getByLabel('Precio unitario').fill('12.345');
  await form(page).getByRole('button', { name: 'Guardar' }).click();

  await expect(form(page).getByLabel('Cantidad en stock')).toHaveAccessibleDescription(
    'La cantidad debe ser un número entero mayor o igual a 0',
  );
  await expect(form(page).getByLabel('Precio unitario')).toHaveAccessibleDescription(
    'El precio debe ser mayor o igual a 0 y tener máximo 2 decimales',
  );
  await expect(rows(page).locator('td').nth(2)).toHaveText('10');
});

test('cancelar sin guardar', async ({ page, request }) => {
  const product = await createProduct(request);
  await openEdit(page, product);

  await form(page).getByLabel('Nombre', { exact: true }).fill('Nombre descartado');
  await form(page).getByRole('button', { name: 'Cancelar' }).click();

  await expect(form(page)).toBeHidden();
  await page.reload();
  await page.getByLabel('Buscar por nombre o SKU').fill(product.sku);
  await expect(rows(page).locator('td').nth(1)).toHaveText(product.name);
});

test('producto inexistente al guardar', async ({ page, request }) => {
  const product = await createProduct(request);
  await openEdit(page, product);
  // Todavía no existe borrado: se simula que el producto desapareció respondiendo 404 al PUT.
  await page.route(`**/api/products/${product.id}`, (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({ status: 404, contentType: 'application/json', body: '{"status":404}' })
      : route.fallback(),
  );

  await form(page).getByLabel('Nombre', { exact: true }).fill('Cambio perdido');
  await form(page).getByRole('button', { name: 'Guardar' }).click();

  await expect(form(page).getByRole('alert')).toHaveText(
    'El producto ya no existe. Actualiza la lista e intenta de nuevo.',
  );
  await expect(form(page).getByLabel('Nombre', { exact: true })).toHaveValue('Cambio perdido');
});
