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
