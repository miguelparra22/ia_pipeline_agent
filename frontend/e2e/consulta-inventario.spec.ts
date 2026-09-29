import { expect, test, type Page } from '@playwright/test';

// HU-001: escenarios de specs/consulta-inventario/spec.md contra el backend real con los seeds.
// La base se comparte con las pruebas de alta (HU-002), así que no se asume un total fijo de filas:
// se comprueban los productos sembrados.

const SEEDED = [
  'Filtro Aceite',
  'Bujía Spark',
  'Pastillas de Freno',
  'Correa de Distribución',
  'Filtro de Aire',
];

const rows = (page: Page) => page.locator('table.product-table tbody tr');
const search = (page: Page) => page.getByLabel('Buscar por nombre o SKU');

async function expectAllSeededVisible(page: Page) {
  for (const name of SEEDED) {
    await expect(rows(page).filter({ hasText: name })).toHaveCount(1);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('consultar el listado completo sin iniciar sesión', async ({ page }) => {
  await expect(page.getByRole('columnheader')).toHaveText([
    'SKU',
    'Nombre',
    'Cantidad en stock',
    'Precio unitario',
    'Acciones',
  ]);
  await expectAllSeededVisible(page);
  await expect(rows(page).filter({ hasText: 'Bujía Spark' })).toContainText(['ALT-02']);
  await expect(page.getByText('No se encontraron productos')).toBeHidden();
});

test('filtrar por nombre', async ({ page }) => {
  await search(page).fill('Bujía');

  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toContainText('Bujía Spark');
});

test('filtrar por SKU', async ({ page }) => {
  await search(page).fill('ALT-02');

  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toContainText('Bujía Spark');
});

test('búsqueda sin resultados', async ({ page }) => {
  await expectAllSeededVisible(page);

  await search(page).fill('Teclado');

  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByText('No se encontraron productos')).toBeVisible();
});

test('limpiar la búsqueda vuelve a mostrar el listado completo', async ({ page }) => {
  await search(page).fill('Filtro Aceite');
  await expect(rows(page)).toHaveCount(1);

  await search(page).fill('');

  await expectAllSeededVisible(page);
});
