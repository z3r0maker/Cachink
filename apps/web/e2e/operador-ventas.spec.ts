import { expect, test, type Page } from '@playwright/test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** Sell through the register's own catalogue: one product ×2 in cash. */
async function venderEfectivo(page: Page, nombre: RegExp, efectivo: string): Promise<void> {
  await page.getByRole('button', { name: nombre }).first().click();
  await page.getByRole('button', { name: nombre }).first().click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill(efectivo);
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/**
 * O-21 (Track O, fase 12; real door O-38): Operador · Ventas over the
 * register's own tickets — this test's two sales, one of them cancelled.
 */
test('the turno figures exclude the cancelled sale', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');
  await venderEfectivo(page, /Taco al pastor/, '60');

  await page.getByRole('link', { name: 'Ventas' }).click();
  await expect(page.getByText('$130.00').first()).toBeVisible();
  await expect(page.getByText('Cancelada', { exact: true })).toHaveCount(0);

  await page.getByTitle('Cancelar venta').first().click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('button', { name: 'Cancelar la venta' })).toBeDisabled();
  await modal.getByRole('button', { name: 'Cobro duplicado' }).click();
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar la venta' }).click();
  await expect(page.getByRole('status')).toContainText('V-0002 cancelada · Cobro duplicado.');
  await expect(page.getByText('Cancelada', { exact: true })).toHaveCount(1);
  await expect(page.getByText('$50.00').first()).toBeVisible();
});

test('search and method filters narrow the list', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');

  await page.getByRole('link', { name: 'Ventas' }).click();
  await page.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await expect(page.getByText('V-0001')).toBeVisible();
  await page.getByRole('button', { name: 'Fiado', exact: true }).click();
  await expect(page.getByText('Sin resultados')).toBeVisible();
  await page.getByLabel('Buscar venta').fill('quesadilla');
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.getByText('V-0001')).toBeVisible();
  await page.getByLabel('Buscar venta').fill('nada así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});
