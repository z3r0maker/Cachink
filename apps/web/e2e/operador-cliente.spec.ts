import { expect, test, type Page } from './test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** One fiado sale on the client's account, from the caja. */
async function fiar(page: Page, producto: RegExp, cliente: RegExp): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Fiado', exact: true }).click();
  await cobro.getByRole('button', { name: cliente }).first().click();
  await cobro.getByRole('button', { name: 'Registrar fiado' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/**
 * O-26 (Track O, fase 12; real door O-38): Detalle de cliente over the
 * register's own account — a fiado sale this test makes, its detail, and the
 * abono that settles it.
 */
test('from Cobranza to the account: balance, open ticket, history', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await fiar(page, /Quesadilla/, /Doña Mari de la tienda/);

  await page.getByRole('link', { name: 'Cobranza' }).click();
  await page.locator('a[href="/operador/cobranza/01HZ8XQN9GZJXV8AKQ5X0CDMAR"]').click();
  await expect(page.locator('main').getByText('$80.00').first()).toBeVisible();
  await expect(page.locator('main').getByText('Al día')).toBeVisible();
  await expect(page.getByText('Venta fiada V-0001')).toBeAttached();
});

test('an abono settles the ticket and lowers the balance', async ({ page }) => {
  await puertaOperador(page, [
    { nombre: 'Orden del cliente', precioCentavos: 6000, sku: 'OPCLI1' },
  ]);
  await page.goto('/operador/caja');
  await fiar(page, /Orden del cliente/, /Doña Mari de la tienda/);

  await page.getByRole('link', { name: 'Cobranza' }).click();
  await page.locator('a[href="/operador/cobranza/01HZ8XQN9GZJXV8AKQ5X0CDMAR"]').click();
  await page.getByRole('button', { name: 'Recibir abono' }).click();
  const modal = page.getByRole('dialog', { name: 'Abono de Doña Mari de la tienda' });
  await modal.getByLabel('Cuánto abona').fill('50');
  await modal.getByRole('button', { name: 'Registrar abono' }).click();
  await expect(page.getByRole('status')).toContainText(
    '$50.00 por efectivo. Se aplicó a lo más antiguo; queda $70.00.',
  );
});

test('a folio that is not in the turno gets the empty state', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/cobranza/nadie');
  await expect(page.getByText('Este cliente no tiene cuenta abierta')).toBeVisible();
});
