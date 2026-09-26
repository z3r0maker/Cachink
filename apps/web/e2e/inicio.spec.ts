import { expect, test } from './test';

import { SERIAL_TAG } from './shared-tenant';
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

/**
 * O-24/ADR-087: the greeting names the account from `auth.users` (seeded:
 * Pedro). ADR-107 moved the setup checklist off Hoy into the sidebar's
 * «Primeros pasos» card; it must count exactly what «¿Cómo empiezo?» lists.
 */
test(
  'the greeting names the account and Primeros pasos counts the real checklist',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    // The branding e2e (C-15) may have left a logo; clearing it keeps «Sube tu
    // logo» open, so the card is guaranteed to show. A shared-tenant write.
    await asTenant(BIZ, (sql) => sql`UPDATE businesses SET logo_url = NULL WHERE id = ${BIZ}`);
    await page.goto('/');
    await expect(page.locator('main').getByRole('heading', { name: 'Hola, Pedro' })).toBeVisible();

    await page.goto('/como-empiezo');
    const items = page.locator('[data-testid^="checklist-"] li');
    const total = await items.count();
    const done = await page.locator('[data-testid^="checklist-"] li[data-done="true"]').count();
    // Really reading data: the seed ticks five steps and the logo is open.
    expect(done).toBeGreaterThanOrEqual(5);
    expect(done).toBeLessThan(total);

    await page.goto('/');
    const card = page.locator('aside').getByRole('link', { name: /Primeros pasos/ });
    await expect(card).toContainText(`${done} de ${total}`);
    await expect(card).toHaveAttribute('href', '/como-empiezo');
  },
);

/** ADR-107: the pending list is built from the same rows as the badges. */
test('Hoy lists low stock among today’s pending items', async ({ page }) => {
  await page.goto('/');
  const lista = page.locator('main').getByTestId('hoy-pendientes');
  await expect(lista.getByRole('link', { name: /se (está|están) acabando/ })).toBeVisible();
});

test('the low-stock row links into the filtered catalogue', async ({ page }) => {
  await page.goto('/');
  await page.locator('main').getByRole('link', { name: 'Ver productos' }).click();
  await expect(page).toHaveURL(/\/productos\?filtro=bajo$/);
  await expect(page.getByRole('button', { name: 'Stock bajo', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
