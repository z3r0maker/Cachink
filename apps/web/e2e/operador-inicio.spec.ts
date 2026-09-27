import { expect, test, type Page } from './test';
import { venderEfectivo } from './cobrar';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/**
 * This test's own catalogue (chaos-proof: the portal specs own the seed). The
 * door seeds each product tracked, at zero stock under its aviso of 3, so each
 * is «por reponer»; nothing ever moves «Abasto de Inicio E2E», and its name
 * sorts first among the empty shelves «Para hoy» lists.
 */
const ABASTO = 'Abasto de Inicio E2E';
const PRODUCTOS = [
  { nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPINICIO1' },
  { nombre: ABASTO, precioCentavos: 1500, sku: 'OPINICIO2' },
] as const;

/** Don Cuentas greets by the device's local hour; the design's fixture says «tardes». */
const SALUDO = /^¡Buen(os días|as tardes|as noches), Ana! La caja está lista\.$/;

/** A KPI tile read as its label, value and hint run together. */
const stat = (page: Page, texto: RegExp) => page.locator('main div').filter({ hasText: texto });

/** The design fixture's day: none of it may show on a linked caja. */
async function sinFixture(page: Page): Promise<void> {
  for (const f of [
    '$2,710.00',
    'Una cancelada a las 12:58',
    'Registrar el gas de la semana',
    'Jueves 14 de mayo',
    'Aclara el corte del 13 de mayo',
  ]) {
    await expect(page.getByText(f)).toHaveCount(0);
  }
  // The owner's messages are Avisos'; Inicio hides the panel while live.
  await expect(page.getByText(/^De parte de /)).toHaveCount(0);
}

/**
 * O-14 (Track O, fase 10; real data O-39): Operador · Inicio answers «what do
 * I do now» from the linked caja's own turno ($500 fondo from the door).
 */
test('before the first sale, Inicio says so and expects the fondo', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador');
  await expect(page.getByRole('heading', { level: 1, name: SALUDO })).toBeVisible();
  await expect(page.getByText('Turno abierto desde las')).toBeVisible();
  await expect(
    page.getByText('Todavía no hay ventas en este turno. La primera se cobra desde aquí.'),
  ).toBeVisible();
  await expect(stat(page, /^Efectivo esperado\$500\.00/).first()).toBeVisible();
  await sinFixture(page);
});

test('after one cash sale, the figures and «Lo primero» follow', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page
    .getByRole('button', { name: /Orden del día/ })
    .first()
    .click();
  await venderEfectivo(page, '50');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await page.goto('/operador');
  await expect(page.getByText('La caja está lista', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Llevas 1 venta en este turno\. La última fue hace /)).toBeVisible();
  for (const label of ['Ventas del turno', 'Cobrado', 'Efectivo esperado', 'Fiado de hoy']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(stat(page, /^Ventas del turno1Ninguna cancelada$/).first()).toBeVisible();
  await expect(stat(page, /^Efectivo esperado\$540\.00/).first()).toBeVisible();
  await expect(stat(page, /^Fiado de hoy\$0\.00/).first()).toBeVisible();
  await sinFixture(page);

  await page.reload();
  await expect(stat(page, /^Efectivo esperado\$540\.00/).first()).toBeVisible();
  await page.locator('main').getByRole('link', { name: 'Cobrar', exact: true }).click();
  await expect(page).toHaveURL(/\/operador\/caja$/);
});

test('«Para hoy» lists low stock, opens its restock, and «Hoy no» lasts the day', async ({
  page,
}) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador');
  const fila = page.getByText(`Reponer ${ABASTO}`, { exact: true });
  await expect(fila).toBeVisible();
  await expect(page.getByText('Quedan 0 · el umbral es 3').first()).toBeVisible();
  await expect(page.getByText('Nada pendiente para hoy')).toHaveCount(0);
  await sinFixture(page);
  for (const f of ['Reponer taco de tripa', 'Cobrar al Taller de Chuy']) {
    await expect(page.getByText(f)).toHaveCount(0);
  }

  // «Ver stock» opens Inventario on that product's «Llegó mercancía».
  // The row: the innermost block holding both its title and its action.
  const row = page
    .locator('div')
    .filter({ has: fila })
    .filter({ has: page.getByRole('link', { name: 'Ver stock' }) })
    .last();
  await row.getByRole('link', { name: 'Ver stock' }).click();
  await expect(page).toHaveURL(/\/operador\/inventario\?reponer=/);
  const panel = page.getByRole('dialog', { name: '¿Qué pasó con la mercancía?' });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(ABASTO);
  await expect(panel.getByLabel('¿Cuánto llegó?')).toBeVisible();

  // «Hoy no» puts it off for today on this device, across a reload.
  await page.goto('/operador');
  await page.getByRole('button', { name: `Hoy no: Reponer ${ABASTO}` }).click();
  await expect(fila).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: SALUDO })).toBeVisible();
  await expect(fila).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver todas' }).click();
  await expect(fila).toBeVisible();
});
