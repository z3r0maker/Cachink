import { expect, test } from './test';

import { clickUntil } from './interact';

/**
 * The movement drawer (B-2).
 *
 * Rows on Ventas y gastos were inert, and «Compartir comprobante» — a
 * read-only action the design keeps for **every** role — had nowhere to live
 * in the portal at all. The drawer is where it lives.
 *
 * This runs on the seeded tenant with the suite's own owner cookie: the point
 * is the path from a row to a receipt, not tenant isolation.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/movimientos?tab=ventas');
  await expect(page.getByRole('heading', { name: 'Ventas y gastos' })).toBeVisible();
});

test('a venta row opens its detail, and closes again', async ({ page }) => {
  const fila = page.locator('main tbody tr').first();
  const concepto = ((await fila.textContent()) ?? '').trim();

  const cajon = page.getByRole('dialog');
  await clickUntil(fila, cajon);
  // The tiles the design specifies (ADR-107): how they paid, who, which caja.
  await expect(cajon.getByText('Cómo pagaron')).toBeVisible();
  await expect(cajon.getByText('Quién cobró')).toBeVisible();
  await expect(cajon.getByText('En qué caja')).toBeVisible();
  expect(concepto.length).toBeGreaterThan(0);

  await page.keyboard.press('Escape');
  await expect(cajon).toBeHidden();
});

test('the drawer offers the comprobante, and the link really renders one', async ({ page }) => {
  const enlace = page.getByTestId('compartir-comprobante');
  await clickUntil(page.locator('main tbody tr').first(), enlace);

  // Not just an href: follow it. A receipt route that 404s or answers JSON
  // is the failure this test exists for — the button looks identical either
  // way, and nobody clicks it until a customer is waiting.
  const href = await enlace.getAttribute('href');
  const respuesta = await page.request.get(href ?? '');
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['content-type']).toContain('image/png');
  expect((await respuesta.body()).byteLength).toBeGreaterThan(1000);
});

test('a gasto has no comprobante to share', async ({ page }) => {
  // Only a venta receipts. The action is absent rather than disabled, which
  // is the portal's rule for an affordance that does not apply.
  await page.goto('/movimientos?tab=gastos');
  await clickUntil(page.locator('main tbody tr').first(), page.getByRole('dialog'));
  await expect(page.getByTestId('compartir-comprobante')).toHaveCount(0);
  // And the field list names the gasto's own classification.
  await expect(page.getByRole('dialog').getByText('Categoría')).toBeVisible();
});
