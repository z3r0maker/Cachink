import { expect, test, type Page } from './test';
import { venderEfectivo } from './cobrar';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

const PRODUCTOS = [{ nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPCIE1' }] as const;

/** Sell one cash ticket of two of the product, paying exactly. */
async function vender(page: Page, producto: RegExp, efectivo: string): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await venderEfectivo(page, efectivo);
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/**
 * The count by denomination, typed into the steppers. Keys are the field's
 * name: «billetes de $20» and «monedas de $20» are different rows, and the
 * coins go down to «monedas de 10¢».
 */
async function contar(page: Page, piezas: Record<string, string>) {
  for (const [d, n] of Object.entries(piezas)) {
    const cuantos = d.startsWith('billetes') ? 'Cuántos' : 'Cuántas';
    await page.getByLabel(`${cuantos} ${d}`, { exact: true }).fill(n);
  }
}

/**
 * O-28 (Track O, fase 12; real door O-38): Cierre de turno over this test's
 * own turno — a fondo of $500 and one cash sale of $80, counted, explained,
 * closed. The queue is the engine's real one: online, it is always empty
 * (the register flushes after each sale), so the blocking band never shows.
 */
test('the count starts at zero, with no verdict until something is counted', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  await expect(page.getByLabel('Cuántos billetes de $1000')).toHaveValue('0');
  const dif = page.getByRole('region', { name: 'Diferencia' });
  await expect(dif).toContainText('Cuenta los billetes y las monedas de la caja.');
  await expect(page.getByText('$580.00').first()).toBeVisible();
});

test('a surplus needs a reason, and «Otra razón» a note, before closing', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  await contar(page, {
    'billetes de $1000': '2',
    'billetes de $500': '1',
    'billetes de $100': '1',
    'monedas de $10': '1',
  });
  await expect(page.getByText('Sobra', { exact: true })).toBeVisible();
  const cerrar = page.getByRole('button', { name: 'Cerrar turno con sobrante de $2,030.00' });
  await expect(cerrar).toBeDisabled();
  await page.getByRole('button', { name: 'Otra razón' }).click();
  await expect(cerrar).toBeDisabled();
  await page.getByLabel('Nota para Pedro').fill('Me dejaron propina');
  await cerrar.click();
  await expect(page.getByText('Quedó un sobrante explicado como «Otra razón».')).toBeVisible();
  await expect(page.getByText('+$2,030.00')).toBeVisible();
});

test('the $20 bill and the $20 coin are counted apart, down to the centavos', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/cierre');
  await contar(page, {
    'billetes de $20': '1',
    'monedas de $20': '2',
    'monedas de 50¢': '1',
    'monedas de 10¢': '3',
  });
  // $20 + $40 + $0.50 + $0.30, exact in centavos.
  await expect(page.getByText('$60.80').first()).toBeVisible();
});

test('a balanced count closes without a note', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  await contar(page, {
    'billetes de $500': '1',
    'billetes de $50': '1',
    'billetes de $20': '1',
    'monedas de $10': '1',
  });
  await expect(page.getByText('Cuadra', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar turno' }).click();
  await expect(page.getByText('¡Turno cerrado!')).toBeVisible();
  await expect(
    page.getByText('El conteo cuadró con lo esperado. Pedro ya lo tiene en su portal.'),
  ).toBeVisible();
  await page.getByRole('button', { name: /Entregar el efectivo a Pedro/ }).click();
  await page.getByRole('button', { name: 'Sí, ya se lo di' }).click();
  await expect(page.getByText('Le entregaste el efectivo a Pedro')).toBeVisible();
});

test('the steppers change the count and its amount', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/cierre');
  const row = page.getByLabel('Cuántos billetes de $1000');
  await expect(row).toHaveValue('0');
  await page.getByRole('button', { name: 'Uno más: billetes de $1000' }).click();
  await expect(row).toHaveValue('1');
  await expect(page.getByText('$1,000.00').first()).toBeVisible();
});
