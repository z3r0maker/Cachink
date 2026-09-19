import { expect, test, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';

/**
 * The Clientes import (N-16's acceptance, at the surface P-07 set): 3 rows →
 * 3 clientes; the same file again → 3 sin cambios; one row's RFC changed →
 * exactly 1 actualizado. There is no Director clientes screen yet, so the
 * round-trip is proven by re-importing — the planner matching against what
 * the first commit wrote. In the `sync` project: it adds rows the shared
 * demo business keeps.
 */
test.describe.configure({ mode: 'serial' });

const RUN = Date.now().toString(36).toUpperCase();
const HEAD = ['nombre', 'telefono', 'rfc'];
const rows = (rfc2: string) => [
  [`Doña Mary ${RUN}`, '55 1234 5678', ''],
  [`Taller El Águila ${RUN}`, '', 'XAXX010101000'],
  [`Consultorio ${RUN}`, '55 8765 4321', rfc2],
];

async function xlsx(data: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Clientes');
  for (const r of data) sheet.addRow(r);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function preview(page: Page, rfc2: string) {
  await page.goto('/importar');
  await page.getByRole('radio', { name: new RegExp(`Clientes`) }).click();
  await page.getByTestId('import-archivo').setInputFiles({
    name: 'clientes.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: await xlsx([HEAD, ...rows(rfc2)]),
  });
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
}

test('three rows become three clientes, then match themselves', async ({ page }) => {
  await preview(page, '');
  await expect(page.getByTestId('import-resumen')).toContainText('3 nuevos · 0 actualizados');
  await page.getByRole('button', { name: 'Importar 3 clientes' }).click();
  await expect(page.getByTestId('import-listo')).toContainText('3 nuevos');

  // The same file again: every row matches what the commit wrote.
  await preview(page, '');
  await expect(page.getByTestId('import-resumen')).toContainText(
    '0 nuevos · 0 actualizados · 3 sin cambios · 0 con error',
  );
});

test('one changed RFC previews exactly one update', async ({ page }) => {
  await preview(page, 'XEXX010101000');
  await expect(page.getByTestId('import-resumen')).toContainText(
    '0 nuevos · 1 actualizados · 2 sin cambios · 0 con error',
  );
});

test('a malformed row is an error row the commit skips', async ({ page }) => {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Clientes');
  for (const r of [HEAD, [`Sin teléfono bueno ${RUN}`, 'abc', ''], [`Válida ${RUN}`, '', '']]) {
    sheet.addRow(r);
  }
  await page.goto('/importar');
  await page.getByRole('radio', { name: /Clientes/ }).click();
  await page.getByTestId('import-archivo').setInputFiles({
    name: 'clientes.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await wb.xlsx.writeBuffer()),
  });
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
  await expect(page.getByTestId('import-resumen')).toContainText(
    '1 nuevos · 0 actualizados · 0 sin cambios · 1 con error',
  );
});
