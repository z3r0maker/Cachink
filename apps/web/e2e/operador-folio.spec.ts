import { asTenant } from '@xangarro/testing/tenant';

import { expect, test } from './test';

import { venderEfectivo } from './cobrar';
import { puertaPropia } from './puerta-propia';

/**
 * Cobrar's folio and turno count come from the register's own tickets, never
 * the design's (V-0413 and 12 sales). On a business of its own the first
 * ticket is V-0001, the count starts at 0, and the receipt carries the folio
 * the sale actually got, which is the one the server holds.
 */
test.beforeEach(() => test.setTimeout(120_000));

const folios = (biz: string) =>
  asTenant(biz, async (sql) =>
    (await sql`SELECT folio FROM tickets ORDER BY folio`).map((r) => Number(r.folio)),
  );

test('Cobrar numbers the next ticket and counts the turno from the register’s own sales', async ({
  page,
}) => {
  const t = await puertaPropia(page, [{ nombre: 'Agua de jamaica', precio: 2500, sku: 'FOLIO1' }]);
  const ticket = page.getByRole('complementary', { name: 'Ticket' });
  const ventas = page.locator('#operador-header-action');
  await expect(ticket).toContainText('Ticket · V-0001');
  await expect(ventas).toHaveText(/Ventas del turno\s*0$/);

  await page
    .getByRole('button', { name: /Agua de jamaica/ })
    .first()
    .click();
  await venderEfectivo(page, '25');
  await expect(page.getByRole('status')).toContainText('Venta registrada');
  await expect(ticket).toContainText('Ticket · V-0002');
  await expect(ventas).toHaveText(/Ventas del turno\s*1$/);

  // The receipt is the sale's own: its folio and its business.
  await page.getByRole('button', { name: 'Comprobante' }).click();
  const recibo = page.getByRole('dialog');
  await expect(recibo).toContainText('V-0001');
  await expect(recibo).toContainText(t.nombre);
  await expect(recibo).not.toContainText('Taquería Don Pedro');

  await expect.poll(() => folios(t.biz)).toEqual([1]);
  await expect(page.getByText('V-0413')).toHaveCount(0);
});
