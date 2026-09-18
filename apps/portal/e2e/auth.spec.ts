import { expect, test } from '@playwright/test';

import { ROUTES } from './routes';

/**
 * The gate itself.
 *
 * Every other spec runs with a cookie from `auth.setup.ts`, which is exactly
 * why these run without one: a suite that is always signed in cannot tell you
 * whether signing in is required. `storageState: undefined` drops the cookie
 * for this file only.
 *
 * Until P-02 the portal had no gate at all — `SESSION` was a module constant,
 * so every visitor was the owner of Taquería Don Pedro and every screen read
 * that tenant's rows.
 */
test.use({ storageState: { cookies: [], origins: [] } });

for (const route of ROUTES) {
  test(`${route.path} redirects a signed-out visitor to /login`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Entra a tu portal' })).toBeVisible();
  });
}

test('a wrong password does not say which half was wrong', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('pedro@taqueria.mx');
  await page.getByTestId('login-password').fill('not-the-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // The same message as an unknown address: telling them apart reveals which
  // emails are registered.
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('an unknown address gets the identical message', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('nobody@example.com');
  await page.getByTestId('login-password').fill('whatever');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
});

test('a forged session cookie is refused, not trusted', async ({ page, context }) => {
  // The payload is real and well-formed; only the signature is wrong. A cookie
  // the server did not sign must be worth nothing at all.
  const claims = Buffer.from(
    JSON.stringify({
      sub: '3f1c0e2a-0000-4000-8000-000000000001',
      email: 'pedro@taqueria.mx',
      role: 'authenticated',
      business_id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      member_role: 'owner',
    }),
  ).toString('base64url');

  await context.addCookies([
    {
      name: 'xg_session',
      value: `${claims}.forged-signature`,
      url: 'http://localhost:3100',
    },
  ]);

  await page.goto('/productos');
  await expect(page).toHaveURL(/\/login$/);
});
