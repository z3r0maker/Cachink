import { asTenant } from '@xangarro/testing/tenant';

import { expect, test, type Page } from './test';

import { cobrarCon } from './cobrar';
import { OPERADORA, puertaPropia } from './puerta-propia';

/**
 * «Deshacer» on the card after a sale cancels that sale (owner decision,
 * 2026-11-21): it opens «Cancelar venta» for it with «Me equivoqué al
 * cobrar» chosen, and only a cancel that goes through (NIP, the operator's
 * permission, the cancellation log) gives the lines back. Before, it gave
 * the lines back and left the sale registered.
 */
test.beforeEach(() => test.setTimeout(120_000));

const PRODUCTO = { nombre: 'Agua de horchata', precio: 3000, sku: 'DESHACER1' };

const cancelada = (biz: string) =>
  asTenant(biz, async (sql) =>
    (await sql`SELECT cancelled_at IS NOT NULL AS c FROM tickets`).map((r) => r.c === true),
  );

/** Sells the product by card (registered at once), then presses «Deshacer». */
async function venderYDeshacer(page: Page) {
  await page
    .getByRole('button', { name: new RegExp(PRODUCTO.nombre) })
    .first()
    .click();
  await cobrarCon(page, 'Tarjeta');
  await expect(page.getByRole('status')).toContainText('Venta registrada');
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
  const dialogo = page.getByRole('alertdialog');
  await expect(dialogo).toContainText('¿Cancelar la venta V-0001?');
  await expect(dialogo.getByRole('radio', { name: 'Me equivoqué al cobrar' })).toBeChecked();
  await dialogo.getByLabel('Tu NIP').fill(OPERADORA.nip);
  await dialogo.getByRole('button', { name: 'Cancelar venta' }).click();
  return dialogo;
}

test('«Deshacer» cancels the sale and gives the lines back to the ticket', async ({ page }) => {
  const t = await puertaPropia(page, [PRODUCTO], { puedeCancelar: true });
  await venderYDeshacer(page);

  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect(
    page.getByRole('complementary', { name: 'Ticket' }).getByText(PRODUCTO.nombre),
  ).toBeVisible();
  await expect(page.locator('#operador-header-action')).toHaveText(/Ventas del turno\s*0$/);
  await expect.poll(() => cancelada(t.biz)).toEqual([true]);
});

test('without the permission, «Deshacer» is refused and the sale stands', async ({ page }) => {
  const t = await puertaPropia(page, [PRODUCTO], { puedeCancelar: false });
  const dialogo = await venderYDeshacer(page);

  await expect(dialogo).toContainText('No tienes permiso para cancelar ventas');
  await expect(page.locator('#operador-header-action')).toHaveText(/Ventas del turno\s*1$/);
  await expect.poll(() => cancelada(t.biz)).toEqual([false]);
});
