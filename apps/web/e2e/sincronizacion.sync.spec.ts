import { expect, test } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-11 on a throwaway tenant: a refused row names its device and says why in a
 * sentence, the Historial records it, and «Marcar como resuelto» is saved —
 * the row stays gone after a reload, with `resolved_at` set.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `sync-${stamp}@test.mx`;
const biz = newUlid();
const dev = newUlid();
const rejection = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('sync-1234');
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Sync ${stamp}`}, 'RESICO', 125, ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
      VALUES (${dev}, 'Caja norte', 'android', 'x', ${biz}, now(), now())`;
    await sql`
      INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, payload, received_at, business_id, created_at, updated_at)
      VALUES (${rejection}, ${dev}, 'sales', ${newUlid()}, 'FK_PRODUCT_MISSING',
              ${sql.json({ preview: 'Venta · Pan ×2' })}, now(), ${biz}, now(), now())`;
  });
});

test('a refused row reads as a sentence, is in the history, and stays resolved', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('sync-1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/sincronizacion');

  const main = page.locator('main');
  const row = main.locator('tr', { hasText: 'Venta · Pan ×2' });
  await expect(row.getByText('Caja norte')).toBeVisible();
  await expect(
    row.getByText('El producto de este registro ya no existe en el portal.'),
  ).toBeVisible();
  await expect(
    page
      .getByRole('list', { name: 'Historial de sincronización' })
      .getByText('Se rechazaron 1 registro de Caja norte.'),
  ).toBeVisible();

  await row.getByRole('button', { name: 'Marcar como resuelto' }).click();
  await expect(main.getByText('Todo sincronizado')).toBeVisible();
  await page.reload();
  await expect(main.getByText('Todo sincronizado')).toBeVisible();
  const [r] = await asTenant(
    biz,
    (sql) =>
      sql`SELECT resolved_at IS NOT NULL AS resolved FROM sync_rejections WHERE id = ${rejection}`,
  );
  expect(r?.resolved).toBe(true);
});
