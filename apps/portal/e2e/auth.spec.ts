import { expect, test } from '@playwright/test';

import { BASE_URL } from './base-url';
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
  // The old signed-claims format, with real claims and a bad signature. Sessions
  // are server-side now (SEC-AUTH-01), so any value the server did not issue —
  // this one included — must be worth nothing at all.
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
      url: BASE_URL,
    },
  ]);

  await page.goto('/productos');
  await expect(page).toHaveURL(/\/login$/);
});

test('signing out ends the session on the server: a copied cookie stops working', async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one real sign-in is enough');
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-email').fill('pedro@taqueria.mx');
  await page.getByTestId('login-password').fill('donpedro123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Pedro', level: 1 })).toBeVisible();
  const copied = (await context.cookies()).find((c) => c.name === 'xg_session');

  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);

  const thief = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  await thief.addCookies([{ ...(copied as NonNullable<typeof copied>), expires: -1 }]);
  const stolen = await thief.newPage();
  await stolen.goto('/productos');
  await expect(stolen).toHaveURL(/\/login$/);
  await context.close();
  await thief.close();
});

test('five wrong passwords lock the address, whether or not it exists', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'counts against one address');
  // Its own client, so the lock it earns touches nothing else in the suite.
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `203.0.113.${Date.now() % 250}` });
  const email = `nadie-${Date.now()}@example.com`;
  await page.goto('/login');
  for (let i = 1; i <= 5; i += 1) {
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(`intento-${i}`);
    // Wait for this attempt's answer: the previous one's message is still on screen.
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Entrar' }).click(),
    ]);
    const expected = i < 5 ? 'Correo o contraseña incorrectos.' : /Demasiados intentos/;
    await expect(page.getByText(expected)).toBeVisible();
  }
});
