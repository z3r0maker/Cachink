import { expect, test, type Page } from './test';
import ExcelJS from 'exceljs';

/**
 * The product import (P-07's acceptance): 3 rows → 3 products; the same file
 * again with one price changed → the preview says exactly 1 update; a viewer
 * sees no create, import or edit affordance at all. In the `sync` project,
 * after every viewport, because it adds products to the shared demo business.
 */
test.describe.configure({ mode: 'serial' });

const RUN = Date.now().toString(36).toUpperCase();
const HEAD = [
  'sku',
  'nombre',
  'categoria',
  'unidad',
  'costo_unitario',
  'precio_venta',
  'seguir_stock',
  'umbral_stock_bajo',
  'icono',
];
const rows = (price2: number) => [
  [`IMP-${RUN}-1`, `Tamal verde ${RUN}`, 'Producto Terminado', 'pza', 8.5, 22, 'sí', 5, ''],
  [`IMP-${RUN}-2`, `Atole ${RUN}`, 'Producto Terminado', 'pza', 4, price2, 'sí', 5, 'coffee'],
  [`IMP-${RUN}-3`, `Masa ${RUN}`, 'Materia Prima', 'kg', 12, 18, 'no', 0, ''],
];

async function xlsx(data: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Productos');
  for (const r of data) sheet.addRow(r);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function preview(page: Page, price2: number) {
  await page.goto('/productos');
  await page.getByRole('button', { name: 'Importar desde Excel' }).click();
  await page.waitForURL((u) => u.pathname === '/importar');
  await page.getByTestId('import-archivo').setInputFiles({
    name: 'productos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: await xlsx([HEAD, ...rows(price2)]),
  });
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
}

test('three rows become three products', async ({ page }) => {
  await preview(page, 15);
  await expect(page.getByTestId('import-resumen')).toContainText('3 nuevos · 0 actualizados');
  await page.getByRole('button', { name: 'Importar 3 productos' }).click();
  await expect(page.getByTestId('import-listo')).toContainText('3 nuevos');
  await page.goto('/productos');
  for (const name of [`Tamal verde ${RUN}`, `Atole ${RUN}`, `Masa ${RUN}`]) {
    await expect(page.locator('main').getByText(name)).toBeVisible();
  }
});

test('the same file with one price changed previews exactly one update', async ({ page }) => {
  await preview(page, 16);
  await expect(page.getByTestId('import-resumen')).toContainText(
    '0 nuevos · 1 actualizados · 2 sin cambios · 0 con error',
  );
});

test('a viewer sees no way to create, import or change products', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill('contador@taqueria.mx');
  await page.getByTestId('login-password').fill('contador123');
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/productos');
  await expect(page.locator('main').getByText('TAC-001')).toBeVisible();
  for (const name of ['Nuevo producto', 'Importar desde Excel', 'Editar', 'Movimiento']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await context.close();
});
