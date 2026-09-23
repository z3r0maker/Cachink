import { expect, test, type Page } from '@playwright/test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

const PRODUCTOS = [{ nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPCOB1' }] as const;

/** One fiado sale: two of the product on the client's account. */
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
 * O-25 (Track O, fase 12; real door O-38): Cobranza over the register's own
 * accounts — the seeded clients, a fiado sale this test makes, and the abono
 * that settles it oldest-first.
 */
test('a fiado sale opens the account, and the abono settles it oldest first', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await fiar(page, /Orden del día/, /Doña Mari de la tienda/);

  await page.getByRole('link', { name: 'Cobranza' }).click();
  await expect(page.getByText('1 ventas abiertas').first()).toBeVisible();
  await expect(page.getByText('$80.00').first()).toBeVisible();

  await page.getByRole('button', { name: 'Recibir abono' }).click();
  const modal = page.getByRole('dialog', { name: 'Abono de Doña Mari de la tienda' });
  await expect(modal.getByRole('button', { name: 'Registrar abono' })).toBeDisabled();
  await modal.getByLabel('Cuánto abona').fill('50');
  await modal.getByRole('button', { name: 'Transferencia' }).click();
  await modal.getByRole('button', { name: 'Registrar abono' }).click();

  await expect(page.getByRole('status')).toContainText(
    '$50.00 de Doña Mari de la tienda por transferencia. Se aplicó a lo más antiguo; queda $30.00.',
  );
  await expect(page.getByText('$30.00').first()).toBeVisible();
});

test('a client without saldo says so, and the filters narrow', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/cobranza');
  await expect(page.getByText('Sin saldo por cobrar').first()).toBeAttached();
  await page.getByLabel('Buscar cliente').fill('nadie así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByLabel('Buscar cliente').fill('mari');
  await expect(page.getByText('Doña Mari de la tienda').first()).toBeVisible();
});
