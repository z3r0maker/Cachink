import { expect, test, type Page } from '@playwright/test';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { linkIn, latestMailTo } from './outbox';
import { asTenant, BIZ } from './sync-phone';

/**
 * ADR-080's emailed links end to end: request → email in the dev outbox →
 * link → signed in. A throwaway member and its own IP each run, so the
 * per-address and per-IP throttles never carry over between runs.
 */
test.describe.configure({ mode: 'serial' });
test.use({
  storageState: { cookies: [], origins: [] },
  extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Date.now() % 250}` },
});

const email = `links-${Date.now()}@test.mx`;

test.beforeAll(async () => {
  const userId = randomUUID();
  await asTenant(BIZ, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, 'x')`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'viewer', ${BIZ}, now(), now())`;
  });
});

async function requestLink(page: Page, from: string, to: string) {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByRole('link', { name: from }).click();
  await page.getByTestId('link-email').fill(to);
  await page.getByRole('button', { name: 'Mandar enlace' }).click();
  await expect(page.getByTestId('link-sent')).toBeVisible();
}

test('a reset link sets a new password and signs in', async ({ page }) => {
  await requestLink(page, '¿Olvidaste tu contraseña?', email);
  const link = await linkIn(email, '/login/restablecer');
  expect(link).not.toBeNull();

  await page.goto(link as string);
  await page.getByTestId('reset-password').fill('corta');
  await page.getByRole('button', { name: 'Guardar y entrar' }).click();
  await expect(page.getByText('Usa mínimo 8 caracteres.')).toBeVisible();
  await page.getByTestId('reset-password').fill('nueva-clave-1');
  await page.getByRole('button', { name: 'Guardar y entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  // The link is spent: a second use says so instead of resetting again.
  await page.context().clearCookies();
  await page.goto(link as string);
  await page.getByTestId('reset-password').fill('otra-clave-2');
  await page.getByRole('button', { name: 'Guardar y entrar' }).click();
  await expect(page.getByText(/Este enlace ya no sirve/)).toBeVisible();

  // …and the new password is the one that works.
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('nueva-clave-1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
});

test('a sign-in link opens a session with one tap, once', async ({ page }) => {
  await requestLink(page, 'Entrar con un enlace por correo', email);
  const link = await linkIn(email, '/login/entrar');
  expect(link).not.toBeNull();

  await page.goto(link as string);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  await page.context().clearCookies();
  await page.goto(link as string);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(/Este enlace ya no sirve/)).toBeVisible();
});

test('an unknown address reads the same, and no email is written', async ({ page }) => {
  const nobody = `nadie-${Date.now()}@test.mx`;
  await requestLink(page, '¿Olvidaste tu contraseña?', nobody);
  expect(await latestMailTo(nobody)).toBeNull();
});
