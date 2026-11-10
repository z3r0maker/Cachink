import { expect, test, type Page } from './test';

import { throttleKey } from '@xangarro/auth-core';
import { API_PATHS, deviceHeaders } from '@xangarro/contracts';
import { randomUUID } from 'node:crypto';

import { hashPairingToken, mintPairingToken } from '../src/lib/pairing-token';
import { linkIn } from './outbox';
import { asOwner, asTenant } from './sync-phone';
import { codeOf, mintCodeFor } from './tenant-phone';
import { mintTenant, submitSignIn, type Tenant } from './tenant';

/**
 * Everything that expires, expired (docs/testing/e2e-test-catalog.md J1-07,
 * J1-11, J3-06's server half). Nobody waits fifteen minutes: each spec earns
 * the real row through the real door, then moves that row's clock into the
 * past on the owner connection (`asOwner`) — the `xangarro` schema's tables
 * are out of the app role's reach by design — and asks again.
 *
 * Its own tenant, and its own client address per test, so no lock or link
 * throttle it earns can touch another spec, or this one's next run.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** A documentation-range IPv6 nobody else in the run sends (RFC 3849). */
const ipOfOwn = (): string => `2001:db8::${randomUUID().slice(0, 4)}:${randomUUID().slice(0, 4)}`;

let t: Tenant;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Candado' });
});

const EXPIRED = 'Este enlace ya no sirve: se usó o caducó. Pide uno nuevo.';

test('five wrong passwords lock the address, and the lock expires', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ipOfOwn() });
  const wrong = { email: t.email, password: 'no-es-la-clave' };
  for (let i = 1; i <= 5; i += 1) {
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST'),
      submitSignIn(page, wrong),
    ]);
    await expect(
      page.getByText(i < 5 ? 'Correo o contraseña incorrectos.' : /Demasiados intentos/),
    ).toBeVisible();
  }
  // Locked means locked: the right password is refused too.
  await submitSignIn(page, t);
  await expect(page.getByText('Demasiados intentos. Vuelve a intentar en 15 min.')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  // Fifteen minutes later, as far as the lock can tell.
  const key = throttleKey('login', 'email', t.email);
  const moved = await asOwner(
    (sql) => sql`UPDATE xangarro.throttle SET locked_until = now() - interval '1 second'
                 WHERE key = ${key} AND locked_until > now() RETURNING key`,
  );
  expect(moved).toHaveLength(1);

  await submitSignIn(page, t);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  // Inside, on this tenant's own business.
  await expect(page.getByText(t.nombre).first()).toBeVisible();
});

async function requestLink(page: Page, from: string): Promise<string> {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByRole('link', { name: from }).click();
  await page.getByTestId('link-email').fill(t.email);
  await page.getByRole('button', { name: 'Mandar enlace' }).click();
  await expect(page.getByTestId('link-sent')).toBeVisible();
  const path = from.startsWith('¿Olvidaste') ? '/login/restablecer' : '/login/entrar';
  const link = await linkIn(t.email, path);
  expect(link, `no ${path} link in the outbox`).not.toBeNull();
  return link as string;
}

/** The link's row, aged past its TTL (30 min reset, 15 min sign-in; ADR-080). */
async function expire(kind: 'reset' | 'magic'): Promise<void> {
  const rows = await asOwner(
    (sql) => sql`UPDATE xangarro.auth_links SET expires_at = now() - interval '1 second'
                 WHERE user_id = ${t.ownerId}::uuid AND kind = ${kind} AND used_at IS NULL
                 RETURNING token_hash`,
  );
  expect(rows).toHaveLength(1);
}

const unused = async (kind: 'reset' | 'magic') =>
  asOwner(
    (sql) => sql<{ n: number }[]>`SELECT count(*)::int AS n FROM xangarro.auth_links
                 WHERE user_id = ${t.ownerId}::uuid AND kind = ${kind} AND used_at IS NULL`,
  );

test('an expired reset link is refused inline, and the password stays as it was', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ipOfOwn() });
  const link = await requestLink(page, '¿Olvidaste tu contraseña?');
  await expire('reset');

  await page.goto(link);
  await page.getByTestId('reset-password').fill('otra-clave-9');
  await page.getByTestId('reset-password-2').fill('otra-clave-9');
  await page.getByRole('button', { name: 'Guardar y entrar' }).click();
  await expect(page.getByText(EXPIRED)).toBeVisible();
  await expect(page).toHaveURL(/\/login\/restablecer/);
  // Refused, not spent: the row is untouched…
  expect((await unused('reset'))[0]?.n).toBe(1);

  // …and the old password is still the one that opens.
  await submitSignIn(page, t);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await expect(page.getByText(t.nombre).first()).toBeVisible();
});

test('an expired sign-in link is refused inline, and opens no session', async ({
  page,
  context,
}) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ipOfOwn() });
  const link = await requestLink(page, 'Entrar con un enlace por correo');
  await expire('magic');

  await page.goto(link);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(EXPIRED)).toBeVisible();
  await expect(page).toHaveURL(/\/login\/entrar/);
  expect((await context.cookies()).find((c) => c.name === 'xg_session')).toBeUndefined();
  expect((await unused('magic'))[0]?.n).toBe(1);
});

const DEVICE = { name: 'Caja vieja', platform: 'android', appVersion: '0.1.0', osVersion: '15' };

test('/activate refuses an expired or unknown code, and an expired or unknown QR, each by name', async ({
  request,
}) => {
  const from = { ...deviceHeaders(), 'x-forwarded-for': ipOfOwn() };
  const activate = (data: Record<string, unknown>) =>
    request.post(API_PATHS.activate, { headers: from, data: { ...data, device: DEVICE } });
  const answer = async (data: Record<string, unknown>) => {
    const r = await activate(data);
    return { status: r.status(), code: (await r.json()).error?.code };
  };

  // A typed code past its 48 h (CODE_TTL_MS), and one that never existed.
  const vieja = await mintCodeFor(t, '-1 minute');
  expect(await answer({ email: t.email, code: vieja })).toEqual({
    status: 410,
    code: 'CODE_EXPIRED',
  });
  expect(await answer({ email: t.email, code: codeOf() })).toEqual({
    status: 400,
    code: 'CODE_INVALID',
  });

  // The scan path: a QR past its 15 minutes on a code that is still live,
  // and a token no code ever carried.
  const token = mintPairingToken();
  const viva = await mintCodeFor(t);
  await asTenant(
    t.biz,
    (sql) => sql`UPDATE activation_codes SET qr_token_hash = ${hashPairingToken(token)},
                   qr_expires_at = now() - interval '1 second' WHERE code = ${viva}`,
  );
  expect(await answer({ qrToken: token })).toEqual({ status: 410, code: 'CODE_EXPIRED' });
  expect(await answer({ qrToken: mintPairingToken() })).toEqual({
    status: 400,
    code: 'CODE_INVALID',
  });

  // Nothing was spent and no phone joined.
  const rows = await asTenant(
    t.biz,
    (sql) => sql<{ code: string; redeemed_at: string | null }[]>`
      SELECT code, redeemed_at FROM activation_codes WHERE code IN (${vieja}, ${viva})`,
  );
  expect(rows.map((r) => r.redeemed_at)).toEqual([null, null]);
  const [phones] = await asTenant(
    t.biz,
    (sql) =>
      sql<{ n: number }[]>`SELECT count(*)::int AS n FROM devices WHERE nombre = 'Caja vieja'`,
  );
  expect(phones?.n).toBe(0);
});
