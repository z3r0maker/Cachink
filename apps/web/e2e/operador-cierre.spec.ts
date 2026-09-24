import { expect, test, type Page } from './test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

const PRODUCTOS = [{ nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPCIE1' }] as const;

/** Sell one cash ticket of two of the product, paying exactly. */
async function vender(page: Page, producto: RegExp, efectivo: string): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill(efectivo);
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/** The count by denomination, typed into the steppers. */
async function contar(page: Page, piezas: Record<string, string>) {
  for (const [d, n] of Object.entries(piezas))
    await page.getByLabel(`Cantidad de $${d}`, { exact: true }).fill(n);
}

/**
 * O-28 (Track O, fase 12; real door O-38): Cierre de turno over this test's
 * own turno — a fondo of $500 and one cash sale of $80, counted, explained,
 * closed. The queue is the engine's real one: online, it is always empty
 * (the register flushes after each sale), so the blocking band never shows.
 */
test('the count starts at zero, a whole shortfall', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar turno' }).click();
  await expect(page.getByLabel('Cantidad de $1000')).toHaveValue('0');
  await expect(page.getByText('Falta', { exact: true })).toBeVisible();
  await expect(page.getByText('$580.00').first()).toBeVisible();
});

test('a surplus needs a reason and a note before closing', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar turno' }).click();
  await contar(page, { 1000: '2', 500: '1', 100: '1', 10: '1' });
  await expect(page.getByText('Sobra', { exact: true })).toBeVisible();
  await expect(page.getByText('$2,030.00')).toBeVisible();
  const cerrar = page.getByRole('button', { name: 'Cerrar turno' });
  await page.getByRole('button', { name: 'Propinas' }).click();
  await expect(cerrar).toBeDisabled();
  await page.getByLabel('Nota').fill('Me dejaron propina');
  await cerrar.click();
  await expect(page.getByText('Quedó un sobrante explicado como «Propinas».')).toBeVisible();
  await expect(page.getByText('+$2,030.00')).toBeVisible();
});

test('a balanced count closes without a note', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar turno' }).click();
  await contar(page, { 500: '1', 50: '1', 20: '1', 10: '1' });
  await expect(page.getByText('Cuadra', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar turno' }).click();
  await expect(page.getByText('Turno cerrado')).toBeVisible();
  await expect(
    page.getByText('El conteo cuadró con lo esperado. Pedro ya lo tiene en su portal.'),
  ).toBeVisible();
});

test('the steppers change the count and its amount', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/cierre');
  const row = page.getByLabel('Cantidad de $1000');
  await expect(row).toHaveValue('0');
  await page.getByTitle('Uno más').first().click();
  await expect(row).toHaveValue('1');
  await expect(page.getByText('$1,000.00').first()).toBeVisible();
});
