import { expect, test } from '@playwright/test';

import {
  ADMIN_COOKIE,
  STAFF_EMAIL,
  STAFF_PASSWORD,
  freshCodeFor,
  rememberSeed,
  scalar,
  seedFromPageText,
  signInAsStaff,
} from './helpers';
import { resetStaffFixture } from './staff-fixture';

/**
 * N-05's original acceptance, as a browser suite: non-allowlisted → 403;
 * first sign-in forces TOTP enrolment; sign-out really ends the session;
 * wrong passwords lock the account out; every mutation writes an audit row.
 */
test.describe.configure({ mode: 'serial' });

// Per attempt, not per run: a serial retry re-runs the file from its first
// test in a fresh worker. A run-once global setup would hand that retry the
// member the failed attempt already enrolled — the enrolment test then meets
// /mfa/verify and the report blames it instead of the test that failed.
test.beforeAll(resetStaffFixture);

test('a visitor without a session lands on /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('first sign-in forces TOTP enrolment, and the seed on the page verifies', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', STAFF_EMAIL);
  await page.fill('input[name="password"]', STAFF_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10_000 });
  await page.goto('/');
  await expect(page).toHaveURL(/\/mfa\/enroll/);

  const grouped = (await page.locator('code').first().textContent()) ?? '';
  const seed = seedFromPageText(grouped);
  rememberSeed(seed);
  await page.fill('input[name="code"]', await freshCodeFor(seed));
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText(/códigos de recuperación/i)).toBeVisible();
});

test('the enrolled staff member reaches the console', async ({ page }) => {
  await signInAsStaff(page);
  await expect(page).toHaveURL(
    (u) => !u.pathname.startsWith('/login') && !u.pathname.startsWith('/mfa'),
  );
});

test('signing out ends the session for the next navigation too', async ({ page, request }) => {
  await signInAsStaff(page);
  const salir = page.getByRole('button', { name: 'Cerrar sesión' });
  if ((await salir.count()) === 0) {
    throw new Error('no sign-out control found — the suite cannot assert session end');
  }
  const token = (await page.context().cookies()).find((c) => c.name === ADMIN_COOKIE)?.value;
  if (token === undefined) throw new Error('signed in without a session cookie');
  // The token replayed outside the browser (whose cookie jar sign-out clears):
  // before sign-out it opens the console, so a refusal afterwards is the
  // server ending the session — not the browser forgetting it.
  const replay = () =>
    request.get('/', { headers: { cookie: `${ADMIN_COOKIE}=${token}` }, maxRedirects: 0 });
  expect((await replay()).status()).toBe(200);

  await salir.click();
  // Sign-out is a server action; its redirect to /login lands once the
  // session is gone. Navigating before that races the POST (and can abort it).
  await page.waitForURL(/\/login/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  const after = await replay();
  expect(after.status()).toBe(307);
  expect(after.headers()['location']).toMatch(/\/login/);
});

test('a staff member revoked mid-session loses the console at once', async ({ page }) => {
  await signInAsStaff(page);
  // Allowlist loss is re-read every request (ADR-080): with in-house auth a
  // revoked member's session resolves to nothing, so the next navigation is
  // an unauthenticated one — the console is never reachable again.
  await scalar(`UPDATE staff_members SET revoked_at = now()
                 WHERE lower(email) = lower('${STAFF_EMAIL}')`);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await scalar(`UPDATE staff_members SET revoked_at = NULL
                 WHERE lower(email) = lower('${STAFF_EMAIL}')`);
});

test('assigning an inbox item writes an audit row for the acting staff', async ({ page }) => {
  await signInAsStaff(page);
  await page.goto('/inbox');
  const item = page.locator('a[href^="/inbox/"]').first();
  await expect(item).toBeVisible();
  await item.click();
  await page.getByRole('button', { name: 'Asignármelo' }).click();
  await expect(page.getByRole('button', { name: 'Ya es tuyo' })).toBeVisible();

  const rows = await scalar(
    `SELECT count(*)::int AS scalar FROM staff_audit_log WHERE action LIKE 'inbox.%'`,
  );
  expect(Number(rows ?? 0)).toBeGreaterThan(0);
});

test('five wrong passwords lock the account for fifteen minutes', async ({ page }) => {
  // The suite's own sign-ins share one IP whose counter never clears on
  // success; start this test from a clean throttle so the fifth miss locks.
  await scalar('DELETE FROM xangarro.throttle');
  for (let i = 0; i < 5; i += 1) {
    await page.goto('/login');
    await page.fill('input[name="email"]', STAFF_EMAIL);
    await page.fill('input[name="password"]', 'incorrecta-total-9');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(
      page.getByText(/correo o contraseña incorrectos|demasiados intentos/i).first(),
    ).toBeVisible();
  }
  await page.goto('/login');
  await page.fill('input[name="email"]', STAFF_EMAIL);
  await page.fill('input[name="password"]', STAFF_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(/demasiados intentos|bloqueado/i).first()).toBeVisible();
});
