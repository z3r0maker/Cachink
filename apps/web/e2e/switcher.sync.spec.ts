import { expect, test, type Page } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-02's business switcher on throwaway tenants: an account in two businesses
 * starts on the first, switches to the second from the header, and sees the
 * second's data under its own role there.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `dos-negocios-${stamp}@test.mx`;
const password = 'dos-negocios-1';
const A = { id: newUlid(), nombre: `Panadería ${stamp}`, role: 'owner' };
const B = { id: newUlid(), nombre: `Cafetería ${stamp}`, role: 'viewer' };

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword(password);
  await asTenant(
    A.id,
    (sql) =>
      sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`,
  );
  // A first: the membership lookup orders by when the account joined.
  for (const [i, b] of [A, B].entries()) {
    await asTenant(b.id, async (sql) => {
      await sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${b.id}, ${b.nombre}, 'RESICO', '626', 125, ${b.id}, ${newUlid()}, now(), now())`;
      await sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${newUlid()}, ${userId}, ${b.role}, ${b.id}, now() + ${`${i} seconds`}::interval, now())`;
    });
  }
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

test('an account in two businesses switches from the header', async ({ page }) => {
  await signIn(page);
  const header = page.locator('header');
  await expect(header.getByText(A.nombre)).toBeVisible();
  await expect(header.getByText('Dueño')).toBeVisible();

  await header.getByRole('button', { name: 'Cambiar de negocio' }).click();
  await page.getByRole('menuitemradio', { name: new RegExp(B.nombre) }).click();

  await expect(header.getByText(B.nombre)).toBeVisible();
  await expect(header.getByText('Solo lectura')).toBeVisible();
  await page.goto('/negocio');
  await expect(page.locator('main').getByText(B.nombre)).toBeVisible();
  // Read-only there: the owner's controls are gone.
  await expect(page.getByRole('button', { name: 'Editar negocio' })).toHaveCount(0);
});
