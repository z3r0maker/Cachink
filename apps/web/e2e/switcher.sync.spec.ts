import { expect, test } from './test';

import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * P-02's business switcher on tenants of its own: an account in two businesses
 * starts on the first, switches to the second from the sidebar (ADR-107), and
 * sees the second's data under its own role there.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let A: Tenant;
let B: Tenant;

test.beforeAll(async () => {
  // A first: the membership lookup orders by when the account joined, and B's
  // membership is a second later for exactly that reason.
  A = await mintTenant({ label: 'Panadería' });
  B = await mintTenant({ label: 'Cafetería', role: 'viewer', owner: A, joinedAfter: 1 });
});

test('an account in two businesses switches from the sidebar', async ({ page }) => {
  await signIn(page, A);
  const aside = page.locator('aside');
  await expect(aside.getByText(A.nombre)).toBeVisible();
  await expect(aside.getByText('Dueño')).toBeVisible();

  await aside.getByRole('button', { name: 'Cambiar de negocio' }).click();
  await page.getByRole('menuitemradio', { name: new RegExp(B.nombre) }).click();

  await expect(aside.getByText(B.nombre)).toBeVisible();
  await expect(aside.getByText('Solo lectura')).toBeVisible();
  await page.goto('/negocio');
  await expect(page.locator('main').getByText(B.nombre)).toBeVisible();
  // Read-only there: the owner's controls are gone.
  await expect(page.getByRole('button', { name: 'Editar datos generales' })).toHaveCount(0);
});
