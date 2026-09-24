import { expect, test } from './test';
import assert from 'node:assert/strict';

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
    await expect(page.getByRole('heading', { name: '¿Cómo vas a entrar?' })).toBeVisible();
  });
}

test('the owner door reveals the member form, and the way back works', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await expect(page.getByRole('heading', { name: 'Entra a tu portal' })).toBeVisible();
  await expect(page.getByTestId('login-email')).toBeVisible();

  // The way back, for whoever picked the wrong door. It was a dead control
  // once: the door lived in component state and «Volver» linked to the
  // address the visitor was already at, so nothing changed.
  await page.getByRole('link', { name: '‹ Volver' }).click();
  await expect(page.getByRole('heading', { name: '¿Cómo vas a entrar?' })).toBeVisible();

  // And the browser's own Back, which was dead for the same reason.
  await page.getByTestId('login-door-owner').click();
  await expect(page.getByTestId('login-email')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '¿Cómo vas a entrar?' })).toBeVisible();
});

test('the caja door leads to the register, never to the member form', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-caja').click();
  // An unlinked browser lands on the register's own gate: the linking
  // ceremony, not a password form.
  await expect(page).toHaveURL(/\/operador$/);
  await expect(page.getByRole('heading', { name: 'Vincula esta caja' })).toBeVisible();
  await expect(page.getByTestId('login-email')).toHaveCount(0);
});

test('a wrong password does not say which half was wrong', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill('pedro@taqueria.mx');
  await page.getByTestId('login-password').fill('not-the-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // The same message as an unknown address: telling them apart reveals which
  // emails are registered.
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  // Still on the login route, whichever door — the refusal must not navigate.
  // The redirect assertions elsewhere keep the strict `/login$`: nothing has
  // chosen a door at that point, so a query string there would be wrong.
  await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('an unknown address gets the identical message', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
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
  await page.getByTestId('login-door-owner').click();
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
  await page.getByTestId('login-door-owner').click();
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

/**
 * A-12 / ADR-093: the handoff's hero illustration is block 2 of the brand
 * panel, in its own framed box at the asset's 2.5:1 ratio.
 */
test('the login panel carries the hero illustration at its own ratio', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the panel exists at ≥1024 px');
  await page.goto('/login');
  const hero = page.getByRole('img', {
    name: 'Una taquera atiende su puesto con el teléfono en la mano',
  });
  await expect(hero).toBeVisible();
  // Served optimised, never the 1.4 MB source PNG.
  await expect(hero).toHaveAttribute('src', /hero-taqueria\.webp|\/_next\/image/);

  const caja = await hero.boundingBox();
  const ratio = (caja?.width ?? 0) / (caja?.height ?? 1);
  expect(ratio).toBeGreaterThan(2.35);
  expect(ratio).toBeLessThan(2.65);
});

/** P-02: the login animation — four scenes on one clock, held under reduced motion.
 * Desktop-only: below 1024 px the yellow panel folds away by design. */
test('the login panel carries the four-scene animation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the panel exists at ≥1024 px');
  await page.goto('/login');
  const stage = page.getByTestId('animacion-acceso');
  await expect(stage).toBeVisible();

  // The scene index rides the stage; over 20 s it must pass through all four.
  const vistas = new Set<string>();
  for (let i = 0; i < 40; i += 1) {
    const escena = await stage.getAttribute('data-escena');
    if (escena !== null) vistas.add(escena);
    await page.waitForTimeout(550);
    if (vistas.size === 4) break;
  }
  assert(vistas.size === 4, `expected 4 scenes, saw ${[...vistas].join(',')}`);

  // Focus pauses the clock: with the email input focused the scene holds.
  // The field lives behind the owner door, and the panel is the same either
  // side of it — the animation is the layout's, not the card's.
  await page.goto('/login?puerta=dueno');
  await page.getByTestId('login-email').focus();
  const alFoco = await stage.getAttribute('data-escena');
  await page.waitForTimeout(1400);
  assert.equal(await stage.getAttribute('data-escena'), alFoco, 'focus pauses the stage');
});

test('below 1024 px the panel folds away and the card stands alone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const page = await context.newPage();
  // Straight to the member form: the point is the panel, and the form is the
  // widest card the login has to stand alone with.
  await page.goto('/login?puerta=dueno');
  await expect(page.getByTestId('animacion-acceso')).toBeHidden();
  await expect(page.getByTestId('login-email')).toBeVisible();
  await context.close();
});

test('with reduced motion the animation holds scene four', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/login');
  await expect(page.getByTestId('animacion-acceso')).toHaveAttribute('data-escena', '3');
  await context.close();
});
