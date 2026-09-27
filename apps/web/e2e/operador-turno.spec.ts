import { expect, test, type Page } from './test';
import { venderEfectivo } from './cobrar';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** This test's own catalogue (chaos-proof: the portal specs own the seed). */
const PRODUCTOS = [{ nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPTURNO1' }] as const;

/** One «Orden del día» ($40.00) in cash, paid with $50. */
async function venderUna(page: Page): Promise<void> {
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: /Orden del día/ })
    .first()
    .click();
  await venderEfectivo(page, '50');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/** A KPI tile read as its label, value and hint run together. */
const stat = (page: Page, texto: RegExp) => page.locator('main div').filter({ hasText: texto });

/** The design fixture's figures: none may show on a linked caja. */
async function sinFixture(page: Page): Promise<void> {
  for (const f of ['$2,710.00', 'Venta V-0412', 'Renta del local', 'Taller de Chuy']) {
    await expect(page.getByText(f)).toHaveCount(0);
  }
  await expect(page.getByText('Salieron de la caja · 4 comprobantes')).toHaveCount(0);
}

/**
 * O-15 (Track O, fase 10; real data O-39): Operador · Turno over the linked
 * caja's own turno. The door opens it with a $500 fondo; every other figure
 * is one this test made.
 */
test('Mi turno shows this turno: one cash sale on a $500 fondo', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await venderUna(page);
  await page.goto('/operador/turno');
  await expect(page.getByRole('heading', { level: 1, name: 'Mi turno' })).toBeVisible();
  await expect(page.getByText(/Ana Robledo, Caja 1, desde las/)).toBeVisible();

  const esperado = page.getByRole('region', { name: 'Efectivo que debe haber en la caja' });
  await expect(esperado).toContainText('$540.00');
  await expect(esperado).toContainText('$500.00');
  await expect(esperado).toContainText('+$40.00');
  await expect(stat(page, /^Ventas1Ninguna cancelada$/).first()).toBeVisible();
  await expect(stat(page, /^Cobrado\$40\.00Todos los métodos$/).first()).toBeVisible();
  await expect(page.getByText('Venta V-0001')).toBeVisible();
  await expect(page.getByText('1 Orden del día', { exact: true })).toBeVisible();
  await sinFixture(page);

  await page.reload();
  await expect(esperado).toContainText('$540.00');
  await expect(page.getByText('Venta V-0001')).toBeVisible();
});

test('a gasto of the turno comes out of the expected cash', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Registrar gasto' });
  await modal.getByLabel('¿Cuánto?').fill('150');
  await modal.getByLabel('¿Qué compraste?').fill('Hielo');
  await modal.getByRole('button', { name: 'Insumos', exact: true }).click();
  await modal.getByRole('button', { name: /^Registrar gasto de / }).click();
  await expect(page.getByRole('status')).toContainText('−$150.00 · Hielo');

  await page.goto('/operador/turno');
  const esperado = page.getByRole('region', { name: 'Efectivo que debe haber en la caja' });
  await expect(esperado).toContainText('$350.00');
  await expect(esperado).toContainText('−$150.00');
  await expect(page.getByText('Gasto · Hielo')).toBeVisible();
  await expect(stat(page, /^Ventas0Ninguna cancelada$/).first()).toBeVisible();
  await sinFixture(page);
});

test('the header offers «Nueva venta» and «Cerrar mi turno» leads to the close', async ({
  page,
}) => {
  await puertaOperador(page);
  await page.goto('/operador/turno');
  await expect(page.locator('header').getByRole('link', { name: 'Nueva venta' })).toBeVisible();
  await page.locator('main').getByRole('link', { name: 'Cerrar mi turno' }).click();
  await expect(page).toHaveURL(/\/operador\/cierre$/);
});
