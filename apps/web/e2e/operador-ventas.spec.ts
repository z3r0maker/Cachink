import { expect, test, type Page } from './test';
import { venderEfectivo as pagarEfectivo } from './cobrar';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** This test's own catalogue (chaos-proof: the portal specs own the seed). */
const PRODUCTOS = [
  { nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPVENT1' },
  { nombre: 'Refresco de la casa', precioCentavos: 2500, sku: 'OPVENT2' },
] as const;

/** Sell through the register's own catalogue: one product ×2 in cash. */
async function venderEfectivo(page: Page, nombre: RegExp, efectivo: string): Promise<void> {
  await page.getByRole('button', { name: nombre }).first().click();
  await page.getByRole('button', { name: nombre }).first().click();
  await pagarEfectivo(page, efectivo);
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/**
 * O-21 (Track O, fase 12; real door O-38): Operador · Ventas over the
 * register's own tickets — this test's two sales, one of them cancelled.
 */
test('the turno figures exclude the cancelled sale', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Orden del día/, '100');
  await venderEfectivo(page, /Refresco de la casa/, '60');

  await page.getByRole('link', { name: 'Ventas' }).click();
  await expect(page.getByText('$130.00').first()).toBeVisible();
  await expect(page.getByText('Cancelada', { exact: true })).toHaveCount(0);

  // The row opens the ticket's side panel; cancelling happens from there.
  await page.getByRole('button', { name: /^Ver venta V-0002/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('alertdialog', { name: '¿Cancelar la venta V-0002?' });
  await expect(modal.getByRole('button', { name: 'Cancelar venta' })).toBeDisabled();
  await modal.getByRole('radio', { name: 'Cobré de más' }).click();
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar venta' }).click();
  const cajon = page.getByRole('dialog');
  await expect(cajon.getByRole('status')).toContainText('V-0002 cancelada · Cobré de más.');
  await cajon.getByRole('button', { name: 'Listo' }).click();
  await expect(page.getByText('Cancelada', { exact: true })).toHaveCount(1);
  await expect(page.getByText('$50.00').first()).toBeVisible();
});

test('search and method filters narrow the list', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Orden del día/, '100');

  await page.getByRole('link', { name: 'Ventas' }).click();
  await page.getByRole('radio', { name: 'Efectivo', exact: true }).click();
  await expect(page.getByText('V-0001')).toBeVisible();
  await page.getByRole('radio', { name: 'Fiado', exact: true }).click();
  await expect(page.getByText('No hay ventas con ese filtro')).toBeVisible();
  await page.getByLabel('Buscar venta').fill('orden');
  await page.getByRole('radio', { name: 'Todas', exact: true }).click();
  await expect(page.getByText('V-0001')).toBeVisible();
  await page.getByLabel('Buscar venta').fill('nada así');
  await expect(page.getByText('No hay ventas con ese filtro')).toBeVisible();
});
