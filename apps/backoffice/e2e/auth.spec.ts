import { expect, test, type Page } from '@playwright/test';
import { softPasskey } from '@xangarro/auth-core/testing';
import { createDb } from '@xangarro/data-pg';

import { mintEnrolmentLink } from '../scripts/staff-links';
import { ADMIN_COOKIE, STAFF_EMAIL, scalar, signInAsStaff } from './helpers';
import { virtualAuthenticator } from './passkeys';
import { ENLACE_EMAIL, resetStaffFixture } from './staff-fixture';

/**
 * The console's door with passkeys (N-85, ADR-160), through Chromium's
 * virtual authenticator: a printed link registers the first passkey, one tap
 * opens the console, «Mi acceso» adds and removes passkeys behind a fresh tap,
 * sign-out and revocation end the session, and refusals lock an address.
 */
test.describe.configure({ mode: 'serial' });

// Per attempt, not per run: a serial retry re-runs the file from its first
// test in a fresh worker, and the seeded passkey's private key lives in it.
test.beforeAll(resetStaffFixture);

const superDb = () => createDb(process.env.DATABASE_SUPER_URL ?? process.env.DATABASE_URL ?? '');

async function staffId(email: string): Promise<string> {
  const id = await scalar<string>(
    `SELECT id AS scalar FROM staff_members WHERE lower(email) = lower('${email}') AND revoked_at IS NULL`,
  );
  if (id === null) throw new Error(`no staff member ${email}`);
  return id;
}

const livePasskeys = async (email: string) =>
  Number(
    await scalar(`SELECT count(*)::int AS scalar FROM staff_passkeys p JOIN staff_members m ON m.id = p.staff_id
                   WHERE lower(m.email) = lower('${email}') AND p.revoked_at IS NULL`),
  );

async function openLink(page: Page, email: string): Promise<string> {
  const token = await mintEnrolmentLink(superDb(), await staffId(email));
  await page.goto(`/acceso/registrar#${token}`);
  return token;
}

test('a visitor without a session lands on /login, which asks for no email or password', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'Entrar con mi llave' })).toBeVisible();
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
});

test('a printed link registers a passkey, and that passkey opens the console', async ({ page }) => {
  await virtualAuthenticator(page);
  const token = await openLink(page, ENLACE_EMAIL);
  await expect(page.getByText('Enlace E2E')).toBeVisible();
  await page.getByRole('button', { name: 'Crear mi llave' }).click();
  await expect(page.getByRole('heading', { name: 'Listo, ya tienes llave.' })).toBeVisible();
  expect(await livePasskeys(ENLACE_EMAIL)).toBe(1);

  await page.getByRole('link', { name: 'Entrar a la consola' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole('button', { name: 'Entrar con mi llave' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await expect(page.getByRole('complementary').getByText(ENLACE_EMAIL)).toBeVisible();

  // The same link, again: spent.
  await page.goto(`/acceso/registrar#${token}`);
  await expect(page.getByRole('heading', { name: 'Este enlace ya se usó.' })).toBeVisible();
});

test('an expired or made-up link registers nothing', async ({ page }) => {
  await virtualAuthenticator(page);
  const token = await openLink(page, ENLACE_EMAIL);
  await scalar(`UPDATE staff_enrolment_links SET created_at = now() - interval '2 hours',
                       expires_at = now() - interval '1 hour'
                 WHERE staff_id = '${await staffId(ENLACE_EMAIL)}' AND used_at IS NULL`);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Este enlace ya venció.' })).toBeVisible();
  await page.goto(`/acceso/registrar#${token.slice(0, -2)}xx`);
  await expect(page.getByRole('heading', { name: 'Este enlace ya no sirve.' })).toBeVisible();
  expect(await livePasskeys(ENLACE_EMAIL)).toBe(1);
});

test('«Mi acceso» adds a second passkey, re-asks after 5 minutes, and removes one', async ({
  page,
}) => {
  await signInAsStaff(page);
  await page.getByRole('link', { name: 'Mi acceso' }).click();
  await expect(page.getByRole('heading', { name: 'Mi acceso', level: 1 })).toBeVisible();
  await expect(page.getByText('Solo tienes una llave.')).toBeVisible();
  await expect(page.getByText('Con esta entraste')).toBeVisible();

  // On the device that already holds a key, the browser refuses a second one
  // (the options exclude it): that is «No se guardó».
  await page.getByRole('button', { name: 'Agregar llave' }).click();
  await expect(page.getByText('No se guardó la llave nueva.')).toBeVisible();
  // The same session on another device: an authenticator with no key yet.
  const { cdp, id } = await virtualAuthenticator(page);
  await cdp.send('WebAuthn.clearCredentials', { authenticatorId: id });
  await page.getByRole('button', { name: 'Agregar llave' }).click();
  await expect(page.getByText(/^Guardamos «/)).toBeVisible();
  expect(await livePasskeys(STAFF_EMAIL)).toBe(2);
  await expect(page.getByRole('button', { name: 'Quitar' })).toHaveCount(2);

  // Older than 5 minutes: the next change asks for a fresh tap first.
  await scalar(`UPDATE staff_sessions SET stepped_up_at = now() - interval '10 minutes'
                 WHERE staff_id = '${await staffId(STAFF_EMAIL)}'`);
  await page.getByRole('button', { name: 'Quitar' }).nth(1).click();
  await page.getByRole('button', { name: 'Quitar llave' }).click();
  await expect(page.getByRole('heading', { name: 'Confirma que eres tú' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar con mi llave' }).click();
  await expect(page.getByText(/^Quitamos «/)).toBeVisible();
  expect(await livePasskeys(STAFF_EMAIL)).toBe(1);
  const audit = await scalar(
    `SELECT string_agg(action, ',' ORDER BY at) AS scalar FROM staff_audit_log
      WHERE staff_id = '${await staffId(STAFF_EMAIL)}' AND action LIKE 'auth.%llave%'`,
  );
  expect(audit).toContain('auth.registrar_llave');
  expect(audit).toContain('auth.reconfirmar_llave');
  expect(audit).toContain('auth.quitar_llave');
});

test('signing out ends the session for the next navigation too', async ({ page, request }) => {
  await signInAsStaff(page);
  const token = (await page.context().cookies()).find((c) => c.name === ADMIN_COOKIE)?.value;
  if (token === undefined) throw new Error('signed in without a session cookie');
  // The token replayed outside the browser: before sign-out it opens the
  // console, so a refusal afterwards is the server ending the session.
  const replay = () =>
    request.get('/', { headers: { cookie: `${ADMIN_COOKIE}=${token}` }, maxRedirects: 0 });
  expect((await replay()).status()).toBe(200);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL(/\/login/);
  const after = await replay();
  expect(after.status()).toBe(307);
  expect(after.headers()['location']).toMatch(/\/login/);
});

test('a staff member revoked mid-session loses the console at once', async ({ page }) => {
  await signInAsStaff(page);
  await scalar(
    `UPDATE staff_members SET revoked_at = now() WHERE lower(email) = lower('${STAFF_EMAIL}')`,
  );
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await scalar(
    `UPDATE staff_members SET revoked_at = NULL WHERE lower(email) = lower('${STAFF_EMAIL}')`,
  );
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

test('a passkey that is not the team’s is refused, and twenty refusals lock the address', async ({
  browser,
}) => {
  // Its own client address, so the lock never reaches the other specs.
  const context = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.85' },
  });
  const page = await context.newPage();
  const { cdp, id } = await virtualAuthenticator(page);
  // A stranger's passkey for this site: the browser offers it, the console has never seen it.
  await cdp.send('WebAuthn.addCredential', {
    authenticatorId: id,
    credential: {
      credentialId: Buffer.from('stranger-e2e-0001').toString('base64'),
      isResidentCredential: true,
      rpId: 'localhost',
      privateKey: softPasskey('eA').pkcs8,
      userHandle: Buffer.from('x').toString('base64'),
      signCount: 0,
    },
  });
  await page.goto('/login');
  const boton = page.getByRole('button', { name: 'Entrar con mi llave' });
  await boton.click();
  await expect(page.getByText('Esa llave no abre esta puerta.')).toBeVisible();
  const settled = () =>
    page.waitForFunction(
      () =>
        document.body.innerText.includes('Demasiados intentos') ||
        !document.querySelector('main button[disabled]'),
    );
  for (let i = 1; i < 21; i += 1) {
    await settled();
    if (await page.getByText('Demasiados intentos desde esta red.').isVisible()) break;
    await boton.click();
  }
  await expect(page.getByText('Demasiados intentos desde esta red.')).toBeVisible();
  await expect(boton).toBeDisabled();
  await context.close();
});
