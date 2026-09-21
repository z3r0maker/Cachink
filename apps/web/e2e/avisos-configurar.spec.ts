import { expect, test } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-32's acceptance on a throwaway member (the contador role — the matrix is
 * personal, so even Solo lectura sets theirs): toggling a channel persists
 * across a reload, critical rows have no switch, WhatsApp is «Próximamente».
 */
test.use({ storageState: { cookies: [], origins: [] } });

const email = `avisos-${Date.now()}@test.mx`;
const biz = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('avisos-123');
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Avisos ${Date.now()}`}, 'RESICO', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'viewer', ${biz}, now(), now())`;
  });
});

test('a channel switch persists; critical avisos cannot be switched off', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('avisos-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  const open = async () => {
    await page.goto('/avisos');
    await page
      .getByRole('group', { name: 'Avisos' })
      .getByRole('button', { name: /Configurar/ })
      .click();
  };
  await open();
  const correo = page.getByRole('switch', { name: 'Stock bajo por correo' });
  await expect(correo).not.toBeChecked();
  await correo.click();
  await expect(correo).toBeChecked();

  await open();
  await expect(page.getByRole('switch', { name: 'Stock bajo por correo' })).toBeChecked();
  await expect(page.getByRole('switch', { name: /Discrepancia en caja/ })).toHaveCount(0);
  await expect(page.getByText('Obligatorio')).toHaveCount(2);
  await expect(page.getByText('Próximamente')).toHaveCount(6);
});
