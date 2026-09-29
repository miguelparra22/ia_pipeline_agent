import { expect, test, type Page } from '@playwright/test';

// HU-002: escenarios de specs/creacion-producto/spec.md contra el backend real con los seeds.
// La base se comparte entre pruebas: cada alta usa un SKU único por ejecución.

const RUN = Date.now().toString(36).toUpperCase();

const rows = (page: Page) => page.locator('table.product-table tbody tr');
const form = (page: Page) => page.getByRole('region', { name: 'Agregar producto' });

async function openForm(page: Page) {
  await page.getByRole('button', { name: 'Agregar producto' }).click();
  await expect(form(page)).toBeVisible();
}

async function fillForm(page: Page, values: { sku: string; name: string; quantity: string; price: string }) {
  await page.getByLabel('SKU', { exact: true }).fill(values.sku);
  await page.getByLabel('Nombre', { exact: true }).fill(values.name);
  await page.getByLabel('Cantidad en stock').fill(values.quantity);
  await page.getByLabel('Precio unitario').fill(values.price);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(rows(page).filter({ hasText: 'Bujía Spark' })).toHaveCount(1);
});

test('crear un producto válido aunque haya un filtro activo', async ({ page }) => {
  const sku = `E2E-${RUN}-1`;
  const name = `Radiador ${RUN}`;
  await page.getByLabel('Buscar por nombre o SKU').fill('Bujía');
  await expect(rows(page)).toHaveCount(1);

  await openForm(page);
  await fillForm(page, { sku, name, quantity: '8', price: '350000.50' });
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText(`Producto ${name} creado correctamente`)).toBeVisible();
  await expect(form(page)).toBeHidden();
  await expect(page.getByLabel('Buscar por nombre o SKU')).toHaveValue('');
  const row = rows(page).filter({ hasText: sku });
  await expect(row.locator('td')).toHaveText([sku, name, '8', '350.000,50', 'Editar']);
  await expect(rows(page).filter({ hasText: 'Filtro Aceite' })).toHaveCount(1);
});

test('SKU duplicado con otras mayúsculas y espacios', async ({ page }) => {
  await openForm(page);
  await fillForm(page, { sku: ' alt-02 ', name: `Otra ${RUN}`, quantity: '1', price: '1' });
  await page.getByRole('button', { name: 'Guardar' }).click();

  const skuInput = page.getByLabel('SKU', { exact: true });
  await expect(skuInput).toHaveAccessibleDescription('Ya existe un producto con el SKU alt-02');
  await expect(form(page)).toBeVisible();
  await expect(rows(page).filter({ hasText: `Otra ${RUN}` })).toHaveCount(0);
});

test('campos obligatorios vacíos', async ({ page }) => {
  await openForm(page);
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByLabel('SKU', { exact: true })).toHaveAccessibleDescription('El SKU es obligatorio');
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveAccessibleDescription('El nombre es obligatorio');
  await expect(page.getByLabel('Cantidad en stock')).toHaveAccessibleDescription('La cantidad es obligatoria');
  await expect(page.getByLabel('Precio unitario')).toHaveAccessibleDescription('El precio es obligatorio');
});

test('cantidad y precio inválidos', async ({ page }) => {
  await openForm(page);
  await fillForm(page, { sku: `E2E-${RUN}-X`, name: `Inválido ${RUN}`, quantity: '2.5', price: '12.345' });
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByLabel('Cantidad en stock')).toHaveAccessibleDescription(
    'La cantidad debe ser un número entero mayor o igual a 0',
  );
  await expect(page.getByLabel('Precio unitario')).toHaveAccessibleDescription(
    'El precio debe ser mayor o igual a 0 y tener máximo 2 decimales',
  );
  await expect(rows(page).filter({ hasText: `Inválido ${RUN}` })).toHaveCount(0);
});

test('cancelar sin guardar', async ({ page }) => {
  const sku = `E2E-${RUN}-C`;
  await openForm(page);
  await fillForm(page, { sku, name: `Cancelado ${RUN}`, quantity: '1', price: '1' });
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await expect(form(page)).toBeHidden();
  await openForm(page);
  await expect(page.getByLabel('SKU', { exact: true })).toHaveValue('');

  await page.reload();
  await expect(rows(page).filter({ hasText: 'Bujía Spark' })).toHaveCount(1);
  await expect(rows(page).filter({ hasText: sku })).toHaveCount(0);
});
