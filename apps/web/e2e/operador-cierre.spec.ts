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
 * (the register flushes after each sale), so the «por enviar» band never shows.
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
  await page.getByLabel('Nota para los patrones').fill('Me dejaron propina');
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
  // «Ya lo tienen» only once the close went up (P-43, as the phone's M7).
  await expect(
    page.getByText('El conteo cuadró con lo esperado. Los patrones ya lo tienen en su portal.'),
  ).toBeVisible();
  // ADR-147: a reminder on the corte, no handover button.
  await expect(page.getByTestId('cierre-recordatorio')).toHaveText(
    'Guarda $580.00 para los patrones.',
  );
  await expect(page.getByRole('button', { name: /Entregar el efectivo/ })).toHaveCount(0);
});

/**
 * P-43 (board OpCierreCorte): the closed screen sends the corte as the message
 * the owner gets, and opens another turno with the counted cash as its fondo.
 */
test('the closed turno sends its corte and opens another turno with the count', async ({
  page,
}) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await vender(page, /Orden del día/, '80');
  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  await contar(page, { 'billetes de $500': '1', 'billetes de $50': '1', 'billetes de $20': '1' });
  await page.getByRole('button', { name: 'Otra razón' }).click();
  await page.getByLabel('Nota para los patrones').fill('Pagué el garrafón');
  await page.getByRole('button', { name: 'Cerrar turno con faltante de $10.00' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Turno cerrado/ })).toBeVisible();

  await page.getByRole('button', { name: 'Mandar el corte a los patrones' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Mandar el corte a los patrones' });
  const mensaje = dialogo.getByTestId('corte-mensaje');
  await expect(mensaje).toContainText('Contado: $570.00');
  await expect(mensaje).toContainText('Esperado: $580.00');
  await expect(mensaje).toContainText('Faltante: $10.00 (Otra razón)');
  await expect(mensaje).toContainText('1 venta · Cobrado $80.00');
  await expect(dialogo.getByRole('button', { name: /Mensajes/ })).toHaveCount(0);
  await dialogo.getByRole('button', { name: /Copiar el corte/ }).click();
  await expect(dialogo.getByRole('status')).toHaveText(
    'Copiado. Pégalo en el chat o correo que quieras.',
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'Faltante: $10.00 (Otra razón)',
  );
  await dialogo.getByRole('button', { name: 'Listo' }).click();

  await page.getByRole('button', { name: 'Abrir otro turno' }).click();
  const fondo = page.getByRole('dialog', { name: /^¿Con cuánto sigues/ });
  await expect(fondo).toContainText('Terminaste con $570.00.');
  await expect(fondo.getByTestId('fondo-input')).toHaveValue('570.00');
  await fondo.getByTestId('fondo-abrir').click();
  await expect(page).toHaveURL(/\/operador$/);

  // The new turno stands on the counted cash; the closed one is not reopened.
  await page.goto('/operador/turno');
  const esperado = page.getByRole('region', { name: 'Efectivo que debe haber en la caja' });
  await expect(esperado).toContainText('$570.00');
  await expect(page.getByText('Venta V-0001')).toHaveCount(0);
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
