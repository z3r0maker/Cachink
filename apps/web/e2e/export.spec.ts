import ExcelJS from 'exceljs';

import { BIZ, asTenant } from './sync-phone';
import { expect, test } from './test';

/**
 * Exports produce a real file, scoped to the signed-in tenant.
 *
 * Asserting the bytes rather than that a click happened: an .xlsx is a zip, so
 * a response that is HTML — a login redirect, an error page — fails the magic
 * number immediately. That is exactly the failure a "did the button do
 * something" test would miss.
 */
const XLSX_MAGIC = [0x50, 0x4b]; // "PK" — every .xlsx is a zip.

test('Movimientos exports a workbook with a filename', async ({ page }) => {
  await page.goto('/movimientos');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-ventas').click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^xangarro-ventas-\d{4}-\d{2}-\d{2}\.xlsx$/);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);

  expect([bytes[0], bytes[1]]).toEqual(XLSX_MAGIC);
  expect(bytes.length).toBeGreaterThan(1000);
});

/**
 * Data rows of an .xlsx — every row but each sheet's header. Past Excel's row
 * limit an export continues in another sheet (DB3-EXP-01), so all of them.
 */
async function filasDelLibro(bytes: Buffer): Promise<number> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes as unknown as ArrayBuffer);
  return wb.worksheets.reduce((n, w) => n + w.rowCount - 1, 0);
}

/**
 * An export is the whole history (DB2-EXP-01). «Exportar movimientos» used the
 * Productos list, which stops at 50, and the seed has far more than 50
 * movements — so a file with 50 rows was a silently truncated one. The count
 * is compared with the database's, read the plain way, not with a number off
 * the seed.
 */
for (const [dataset, tabla] of [
  ['movimientos', 'inventory_movements'],
  ['ventas', 'sales'],
  ['gastos', 'expenses'],
] as const) {
  test(`the ${dataset} export has every row the database has`, async ({ page }) => {
    const res = await page.request.get(`/api/export/${dataset}`);
    expect(res.status()).toBe(200);
    const filas = await filasDelLibro(await res.body());
    const [{ n }] = await asTenant(
      BIZ,
      (sql) =>
        sql<[{ n: number }]>`SELECT count(*)::int AS n FROM ${sql(tabla)} WHERE deleted_at IS NULL`,
    );
    expect(n, `the seed has no ${tabla} to export`).toBeGreaterThan(0);
    expect(filas).toBe(n);
  });
}

/**
 * DS-02's entry point: Productos › Movimientos exports the whole inventory
 * history, not the fifty rows the tab lists — the file's rows are the table's.
 */
test('Productos › Movimientos downloads every inventory movement', async ({ page }) => {
  await page.goto('/productos');
  await page
    .getByRole('group', { name: 'Productos' })
    .getByRole('button', { name: /^Movimientos/ })
    .click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-movimientos').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^xangarro-movimientos-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const [{ n }] = await asTenant(
    BIZ,
    (sql) =>
      sql<
        [{ n: number }]
      >`SELECT count(*)::int AS n FROM inventory_movements WHERE deleted_at IS NULL`,
  );
  expect(n).toBeGreaterThan(50);
  expect(await filasDelLibro(Buffer.concat(chunks))).toBe(n);
});

/**
 * DS-02: while the file is built the button says so and cannot be pressed
 * again; a refusal is a toast, not a saved error page. The route is held and
 * then answered 429 by the test, so the tenant's real allowance is untouched.
 */
test('the button shows «Preparando tu archivo…» and a refusal becomes a toast', async ({
  page,
}) => {
  await page.goto('/movimientos');
  let release: () => void = () => undefined;
  const held = new Promise<void>((r) => {
    release = r;
  });
  await page.route('**/api/export/ventas', async (route) => {
    await held;
    await route.fulfill({
      status: 429,
      headers: { 'Retry-After': '300' },
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Hiciste varias exportaciones seguidas.' }),
    });
  });
  const boton = page.getByTestId('export-ventas');
  await expect(async () => {
    await boton.click();
    await expect(boton).toHaveText('Preparando tu archivo…', { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(boton).toBeDisabled();
  release();
  await expect(page.getByText('Espera unos minutos')).toBeVisible();
  await expect(boton).toBeEnabled();
  await expect(boton).toHaveText('Exportar');
  await page.unroute('**/api/export/ventas');
});

/** DS-02: a failed build is the board's one-line toast, and the button comes back. */
test('a failed export says «No pudimos generar el archivo. Intenta de nuevo.»', async ({
  page,
}) => {
  await page.goto('/movimientos');
  await page.route('**/api/export/ventas', (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'boom' }),
  );
  const boton = page.getByTestId('export-ventas');
  await expect(async () => {
    await boton.click();
    await expect(page.getByRole('alert')).toContainText(
      'No pudimos generar el archivo. Intenta de nuevo.',
      { timeout: 1_000 },
    );
  }).toPass({ timeout: 15_000 });
  await expect(boton).toBeEnabled();
  await page.getByRole('button', { name: 'Cerrar aviso' }).click();
  await expect(page.getByText('No pudimos generar el archivo. Intenta de nuevo.')).toHaveCount(0);
  await page.unroute('**/api/export/ventas');
});

/**
 * DS-04: the Movimientos tab lists the newest fifty and says so; «Exportar
 * todos» in its footer is the same whole-history file as the header button.
 */
test('Productos › Movimientos says it lists the newest 50, and «Exportar todos» downloads all', async ({
  page,
}) => {
  await page.goto('/productos');
  await page
    .getByRole('group', { name: 'Productos' })
    .getByRole('button', { name: /^Movimientos/ })
    .click();
  const pie = page.getByTestId('movimientos-pie');
  await expect(pie).toContainText('Mostrando los 50 más recientes ·');
  await expect(page.locator('main tbody tr')).toHaveCount(50);
  await expect(page.getByTestId('export-movimientos')).toContainText('XLSX');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    pie.getByRole('button', { name: 'Exportar todos' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^xangarro-movimientos-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const [{ n }] = await asTenant(
    BIZ,
    (sql) =>
      sql<
        [{ n: number }]
      >`SELECT count(*)::int AS n FROM inventory_movements WHERE deleted_at IS NULL`,
  );
  expect(await filasDelLibro(Buffer.concat(chunks))).toBe(n);
});

test('an unknown dataset is refused rather than guessed at', async ({ request }) => {
  const res = await request.get('/api/export/nomina-secreta');
  expect(res.status()).toBe(404);
});

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the export API refuses an unauthenticated request', async ({ request }) => {
    // A route handler, unlike a page, cannot redirect its way to safety — it
    // has to say no.
    const res = await request.get('/api/export/ventas');
    expect(res.status()).toBe(401);
  });
});
