import { expect, test } from './test';

/**
 * «Equipo y nómina» (ADR-107): who cobra at a caja and who is on payroll, on
 * one page, paired by name. Reads the seed only — creating and pairing is
 * operators.spec's (serial), which adds a Rosa Medina operator later.
 */
test('Personas lists who is on payroll without a caja, and offers them one', async ({ page }) => {
  await page.goto('/equipo');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Equipo y nómina', level: 1 })).toBeVisible();
  await expect(main.getByText('En nómina, sin caja')).toBeVisible();
  await expect(
    main.getByRole('button', { name: 'Darle acceso a la caja a Rosa Medina' }),
  ).toBeVisible();
});

test('Nómina is a tab of the same page, and /empleados lands on it', async ({ page }) => {
  await page.goto('/empleados');
  await expect(page).toHaveURL(/\/equipo\?tab=nomina$/);
  const tabs = page.getByRole('group', { name: 'Equipo y nómina' });
  await expect(tabs.getByRole('button', { name: /Nómina/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Ver los pagos de Rosa Medina' })).toBeVisible();
  await expect(page.locator('main').getByText('Nómina de la semana')).toBeVisible();
});

test('the sidebar has one entry for the people', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Equipo y nómina' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Empleados' })).toHaveCount(0);
});
