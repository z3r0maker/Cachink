import { expect, test } from './test';

import { asTenant, BIZ } from './sync-phone';

/**
 * P-13 against the seed, with the business's today pinned to the seed's day
 * (2026-05-12): the heading's date comes from that clock, and «Últimos 30
 * días» states the same totals it draws — the seeded ventas ($885.00) and
 * gastos ($16,710.00) fall inside the window (O-37's seed added rows).
 */
test('Inicio dates itself from the business clock and draws the last 30 days', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main.getByText('martes, 12 de mayo de 2026')).toBeVisible();
  const resumen = 'Últimos 30 días: ventas $885.00, gastos $16,710.00.';
  await expect(main.getByText(resumen)).toBeVisible();
  await expect(main.getByRole('img', { name: resumen })).toBeVisible();
  await expect(main.locator('.recharts-line')).toHaveCount(2);
});

/** O-24/ADR-087: the greeting names the account from `auth.users` (seeded: Pedro). */
test('the greeting names the account and the checklist card reads real data', async ({ page }) => {
  // Order-independent: the branding e2e (C-15) may have left a logo on the
  // seeded business, and this test asserts the logo-pending count.
  await asTenant(BIZ, (sql) => sql`UPDATE businesses SET logo_url = NULL WHERE id = ${BIZ}`);
  await page.goto('/');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Hola, Pedro' })).toBeVisible();
  const card = main.getByTestId('inicio-checklist');
  await expect(card).toBeVisible();

  // The summary counts the items the card renders. It used to say «5 de 6»,
  // which broke twice over: N-17 added the saldos item (six became seven), and
  // whether saldos are ticked depends on whether `saldos-iniciales.spec.ts`
  // ran first — a census here makes this test depend on suite order.
  const items = card.locator('li[data-done]');
  const total = await items.count();
  const listos = await card.locator('li[data-done="true"]').count();
  await expect(main.getByText(`${listos} de ${total} listos.`)).toBeVisible();

  // And it is really reading data, not rendering a constant: the seed ticks
  // operador, productos, código, dispositivo and venta, and the logo was just
  // cleared above, so it cannot be complete.
  expect(listos).toBeGreaterThanOrEqual(5);
  expect(listos).toBeLessThan(total);
  await expect(card.locator('li[data-done="false"]').getByText('Sube tu logo')).toBeVisible();
  await expect(main.getByRole('link', { name: 'Ver todo' })).toHaveAttribute(
    'href',
    '/como-empiezo',
  );
});

test('the low-stock banner links into the filtered catalogue', async ({ page }) => {
  await page.goto('/');
  await page.locator('main').getByRole('link', { name: 'Ver productos' }).click();
  await expect(page).toHaveURL(/\/productos\?filtro=bajo$/);
  await expect(page.getByRole('button', { name: 'Stock bajo', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
