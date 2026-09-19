import { expect, test } from '@playwright/test';

/**
 * P-13 against the seed, with the business's today pinned to the seed's day
 * (2026-05-12): the heading's date comes from that clock, and «Últimos 30
 * días» states the same totals it draws — all six seeded ventas ($645.00) and
 * the five gastos ($16,710.00) fall inside the window.
 */
test('Inicio dates itself from the business clock and draws the last 30 days', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main.getByText('martes, 12 de mayo de 2026')).toBeVisible();
  const resumen = 'Últimos 30 días: ventas $645.00, gastos $16,710.00.';
  await expect(main.getByText(resumen)).toBeVisible();
  await expect(main.getByRole('img', { name: resumen })).toBeVisible();
  await expect(main.locator('.recharts-line')).toHaveCount(2);
});

/** O-24/ADR-087: the greeting names the account from `auth.users.nombre` (seeded: Pedro). */
test('the greeting names the account and the checklist card reads real data', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Hola, Pedro' })).toBeVisible();
  const card = main.getByTestId('inicio-checklist');
  await expect(card).toBeVisible();
  // The seed has operators, products, devices and sales; only the logo is missing.
  await expect(main.getByText('5 de 6 listos.')).toBeVisible();
  await expect(card.getByText('Sube tu logo')).toBeVisible();
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
