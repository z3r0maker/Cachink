import { expect, test, type Page } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-08's archive row on a throwaway tenant (never the seeded one): a wrong name
 * is refused, the right one archives, signs the owner out and unlinks the
 * phones, and the owner cannot sign back in to it.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const email = `archivo-${Date.now()}@test.mx`;
const password = 'archivo-123';
const nombre = `Fonda ${Date.now()}`;
const biz = newUlid();
const dev = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword(password);
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${nombre}, 'RESICO', '626', 125, ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
      VALUES (${dev}, 'Caja', 'android', 'x', ${biz}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
  });
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test('archiving takes the typed name, unlinks the phones and closes the door', async ({ page }) => {
  await signIn(page);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/negocio');
  await page.getByRole('button', { name: 'Archivar negocio' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('archivar-confirmacion').fill('otro nombre');
  await dialog.getByRole('button', { name: 'Archivar' }).click();
  await expect(dialog.getByText(/Escribe el nombre del negocio/)).toBeVisible();

  await dialog.getByTestId('archivar-confirmacion').fill(nombre.toLowerCase());
  await dialog.getByRole('button', { name: 'Archivar' }).click();
  await page.waitForURL((u) => u.pathname.startsWith('/login'));

  const [row] = await asTenant(
    biz,
    (sql) => sql`
      SELECT (SELECT deleted_at IS NOT NULL FROM businesses WHERE id = ${biz}) AS archived,
             (SELECT count(*)::int FROM devices WHERE revoked_at IS NULL) AS live`,
  );
  expect(row).toEqual({ archived: true, live: 0 });

  await signIn(page);
  await expect(page.getByText('Tu cuenta aún no pertenece a ningún negocio.')).toBeVisible();
});
