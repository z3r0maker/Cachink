import { expect, test, type Page } from '@playwright/test';

import { clearFounders, makeSocioFounder, resetSocioFixture, SOCIO } from './founder-fixture';
import { signInAsStaff } from './helpers';

/**
 * E-01 (ADR-124 §1): «Empresa» exists only for founders. A staff member who is
 * not one sees no trace of it and gets a 404 from its pages; once corp names
 * them, the group appears and its page shows corp's real rows.
 */
test.describe.configure({ mode: 'serial' });

// Its own client address: the sign-in throttle is per IP, and without this
// header every local request is «unknown» — the auth suite's lockout test,
// running in parallel, would lock this suite out too.
test.use({ extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.24' } });

test.beforeAll(resetSocioFixture);
test.afterAll(clearFounders);

const empresaGroup = (page: Page) =>
  page.getByRole('navigation', { name: 'Navegación de la consola' }).getByText('Empresa', {
    exact: true,
  });

test('a staff member who is not a founder sees no «Empresa» and gets a 404', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await expect(page.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(empresaGroup(page)).toHaveCount(0);

  const response = await page.goto('/empresa/corporativo');
  expect(response?.status()).toBe(404);
});

test('a founder gets the group and the partners and projects from corp', async ({ page }) => {
  await makeSocioFounder();
  await signInAsStaff(page, SOCIO);
  await expect(empresaGroup(page)).toBeVisible();

  await page.goto('/empresa');
  await expect(page).toHaveURL(/\/empresa\/corporativo$/);
  await expect(page.getByRole('heading', { name: 'Libro corporativo' })).toBeVisible();
  // Real rows, not a heading alone: the founder corp names, and corp's seeded project.
  await expect(page.getByText('Fundador 1 · Socia E2E (tú)')).toBeVisible();
  await expect(page.getByText('Xangarro', { exact: true })).toBeVisible();
});
