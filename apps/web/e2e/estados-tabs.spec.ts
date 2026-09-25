import { expect, test, type Locator, type Page } from './test';

/**
 * Estados' Flujo and Indicadores tabs (P-14, C-13), which no spec opened. The
 * claims are about the numbers, not the headings: the Indicadores margins are
 * the Resultados figures divided by sales, and the Flujo statement adds up to
 * its own headline. Read-only on the seeded tenant, so every viewport runs it.
 */

const main = (page: Page) => page.locator('main');

/** «$1,234.56», «-$15,825.00» or «($640.00)» (a negative line) as centavos. */
function centavos(text: string): number {
  const t = text.trim();
  const negative = t.startsWith('-') || t.startsWith('(');
  const digits = t.replace(/[^\d]/g, '');
  const value = Number(digits);
  return negative ? -value : value;
}

/** The amount on a statement line, found by its label. */
async function linea(scope: Locator, label: string): Promise<number> {
  const row = scope.getByText(label, { exact: true }).locator('xpath=ancestor::div[1]');
  return centavos(await row.locator('span').last().innerText());
}

async function openTab(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

test('Indicadores: each margin is its Resultados figure divided by sales', async ({ page }) => {
  await page.goto('/estados');
  const ingresos = await linea(main(page), 'Ingresos');
  const bruta = await linea(main(page), 'Utilidad bruta');
  const operativa = await linea(main(page), 'Utilidad operativa');
  const neta = await linea(main(page), 'Utilidad neta');
  expect(ingresos, 'the seeded month has sales').toBeGreaterThan(0);

  await openTab(page, 'Indicadores');
  const margen = (valor: number) => `${((valor / ingresos) * 100).toFixed(1)}%`;
  for (const [label, valor] of [
    ['Margen bruto', bruta],
    ['Margen operativo', operativa],
    ['Margen neto', neta],
  ] as const) {
    const card = main(page).getByText(label, { exact: true }).locator('xpath=..');
    await expect(card, label).toContainText(margen(valor));
  }
  // The ratios with no natural ceiling render as cards, each with a figure
  // or «—» when the period has no denominator for it.
  for (const label of [
    'Razón de liquidez',
    'Rotación de inventario',
    'Días promedio de cobranza',
  ]) {
    const card = main(page).getByText(label, { exact: true }).locator('xpath=..');
    await expect(card, label).toContainText(/\d|—/);
  }
});

test('Flujo: the statement adds up, and to its own headline', async ({ page }) => {
  await page.goto('/estados');
  await openTab(page, 'Flujo');
  const m = main(page);

  const contado = await linea(m, 'Cobros de ventas de contado');
  const credito = await linea(m, 'Cobros de crédito a clientes');
  const gastos = await linea(m, 'Gastos operativos');
  const operacion = await linea(m, 'Flujo de operación');
  const compras = await linea(m, 'Compras de inventario');
  const inversion = await linea(m, 'Flujo de inversión');
  const total = await linea(m, 'Incremento neto en efectivo');

  // Negative lines render as (amount); `centavos` reads them as negative.
  expect(operacion).toBe(contado + credito + gastos);
  expect(inversion).toBe(compras);
  expect(total).toBe(operacion + inversion);
  expect(contado, 'the seeded month took cash').toBeGreaterThan(0);

  const headline = await m.getByText(/^Flujo neto del periodo: /).innerText();
  expect(centavos(headline.replace('Flujo neto del periodo: ', ''))).toBe(total);
});
