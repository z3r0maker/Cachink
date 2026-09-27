import { expect, test, type Locator, type Page } from './test';

import { puertaOperador } from './puerta-operador';

/**
 * O-24 (Track O, fase 12; live data): Operador · Inventario on a linked caja.
 * The list is the register's own stocked products — never the design
 * fixture's «Carne de pastor» — and an entrada or a merma goes through the
 * use case, into the ledger, and survives a reload.
 *
 * The seeded products are shared across runs (the door seeds each sku once)
 * and every movement syncs up, so the stock is read before it is moved and
 * each assertion is relative to it.
 */
test.beforeEach(() => test.setTimeout(120_000));

const CHILES = 'Chiles en vinagre E2E';
/** Never moved by any test: its stock is always zero, under its aviso of 3. */
const TOSTADAS = 'Tostadas E2E';
const PRODUCTOS = [
  { nombre: CHILES, precioCentavos: 2500, sku: 'OPINV1' },
  { nombre: TOSTADAS, precioCentavos: 1200, sku: 'OPINV2' },
] as const;

const panelDe = (page: Page): Locator =>
  page.getByRole('dialog', { name: '¿Qué pasó con la mercancía?' });

/** «Hay 7 piezas · aviso en 3 piezas» in the open panel → 7. */
async function hay(panel: Locator): Promise<number> {
  const texto = await panel.getByText(/^Hay \d+ piezas? · aviso en/).textContent();
  const n = /^Hay (\d+)/.exec(texto ?? '')?.[1];
  if (n === undefined) throw new Error(`sin existencias en «${texto}»`);
  return Number(n);
}

async function abrirInventario(page: Page): Promise<void> {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/inventario');
  await expect(
    page.getByRole('region', { name: 'Existencias' }).getByText(CHILES, { exact: true }),
  ).toBeVisible();
}

test('a linked caja lists its own stocked products, not the fixture', async ({ page }) => {
  await abrirInventario(page);
  await expect(page.getByText(TOSTADAS, { exact: true })).toBeVisible();
  await expect(page.getByText('Carne de pastor')).toHaveCount(0);
  await expect(page.getByText('Queso oaxaca')).toHaveCount(0);
  await expect(page.getByText('Se cortó con el calor')).toHaveCount(0);
  // The owner by the name the bootstrap sent (the seed's «Pedro», data-pg 0044), never
  // the fixture's hardcoded one: a caja that doesn't know it would say «el dueño».
  await expect(page.getByText('el ajuste libre de existencias lo hace Pedro')).toBeVisible();
  await expect(page.getByText('lo hace el dueño')).toHaveCount(0);
  // A fresh turno has moved nothing yet.
  await page.getByRole('tab', { name: 'Movimientos de mi turno · 0' }).click();
  await expect(page.getByText('+300 piezas')).toHaveCount(0);
});

test('quantities are whole units on a linked caja', async ({ page }) => {
  await abrirInventario(page);
  await page.getByRole('button', { name: `Llegó mercancía de ${CHILES}` }).click();
  const panel = panelDe(page);
  await panel.getByLabel('¿Cuánto llegó?').fill('1.5');
  await expect(panel.getByText('Escribe una cantidad entera, sin decimales.')).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Registrar entrada de/ })).toBeDisabled();
  await panel.getByLabel('¿Cuánto llegó?').fill('2');
  await expect(panel.getByRole('button', { name: 'Registrar entrada de 2 piezas' })).toBeEnabled();
});

test('an entrada raises the stock, a merma lowers it, and both survive a reload', async ({
  page,
}) => {
  await abrirInventario(page);

  await page.getByRole('button', { name: `Llegó mercancía de ${CHILES}` }).click();
  let panel = panelDe(page);
  const antes = await hay(panel);
  await panel.getByLabel('¿Cuánto llegó?').fill('5');
  await panel.getByLabel(/¿Quién la trajo\?/).fill('Abarrotes Don Beto');
  await panel.getByRole('button', { name: 'Registrar entrada de 5 piezas' }).click();
  await expect(page.getByRole('status')).toContainText(`+5 de ${CHILES}. Queda en tu turno.`);

  await page.getByRole('button', { name: `Se echó a perder o se dañó ${CHILES}` }).click();
  panel = panelDe(page);
  expect(await hay(panel)).toBe(antes + 5);
  await panel.getByLabel('¿Cuánto se echó a perder?').fill('2');
  await panel.getByRole('radio', { name: 'Se rompió' }).click();
  await panel.getByRole('button', { name: 'Registrar merma de 2 piezas' }).click();
  await expect(page.getByRole('status')).toContainText(`−2 de ${CHILES} · Se rompió.`);

  // The live cierre reads the same ledger (in-app navigation keeps the
  // register's Worker, so the writes have landed before the reload).
  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  await expect(page.getByRole('region', { name: 'Resumen del turno' })).toContainText(
    '1 entradas · 1 mermas',
  );

  await page.goto('/operador/inventario');
  await expect(
    page.getByRole('region', { name: 'Existencias' }).getByText(CHILES, { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: `Llegó mercancía de ${CHILES}` }).click();
  expect(await hay(panelDe(page))).toBe(antes + 3);
  await panelDe(page).getByRole('button', { name: 'Cancelar' }).click();

  await page.getByRole('tab', { name: 'Movimientos de mi turno · 2' }).click();
  await expect(page.getByText('+5 piezas').first()).toBeAttached();
  await expect(page.getByText('−2 piezas').first()).toBeAttached();
  await expect(page.getByText('Abarrotes Don Beto').first()).toBeAttached();
  await expect(page.getByText('Se rompió').first()).toBeAttached();
});

test('the caja shows «Quedan N» for a stocked product at or under its aviso', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador/caja');
  await expect(page.getByRole('button', { name: new RegExp(TOSTADAS) }).first()).toContainText(
    'Quedan 0',
  );
});
