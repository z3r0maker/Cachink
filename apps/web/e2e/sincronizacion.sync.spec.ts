import { expect, test } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-11 on a throwaway tenant: a refused row names its device and says why in a
 * sentence, the Historial records it, and «Ya lo resolví» is saved:
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
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/sincronizacion');

  const main = page.locator('main');
  // The history is the last 30 days (DS-03), and its card says so.
  await expect(main.getByText('Últimos 30 días', { exact: true })).toBeVisible();
  const row = main.getByRole('article', { name: 'Venta · Pan ×2' });
  await expect(row.getByText('Caja norte').first()).toBeVisible();
  await expect(
    row.getByText('El producto de este registro ya no existe en el portal.'),
  ).toBeVisible();
  await expect(
    page
      .getByRole('list', { name: 'Historial de sincronización' })
      .getByText('No entró 1 registro de Caja norte.'),
  ).toBeVisible();

  await row.getByRole('button', { name: 'Ya lo resolví' }).click();
  await expect(main.getByText('Todo al día. Tus números están completos.')).toBeVisible();
  await page.reload();
  await expect(main.getByText('Todo al día. Tus números están completos.')).toBeVisible();
  const [r] = await asTenant(
    biz,
    (sql) =>
      sql`SELECT resolved_at IS NOT NULL AS resolved FROM sync_rejections WHERE id = ${rejection}`,
  );
  expect(r?.resolved).toBe(true);
});

/**
 * DS-03's empty state: a tenant whose only activity is older than 30 days
 * has nothing in the history, and the card says so in its own words.
 */
test.describe('nothing in the last 30 days', () => {
  const viejo = `sync-viejo-${stamp}@test.mx`;
  const bizViejo = newUlid();
  const devViejo = newUlid();

  test.beforeAll(async () => {
    const userId = randomUUID();
    const hash = await hashPassword('sync-viejo-1');
    await asTenant(bizViejo, async (sql) => {
      await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${viejo}, ${hash})`;
      await sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${bizViejo}, ${`Sync viejo ${stamp}`}, 'RESICO', 125, ${bizViejo}, ${devViejo}, now(), now())`;
      await sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${newUlid()}, ${userId}, 'owner', ${bizViejo}, now(), now())`;
      await sql`
        INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
        VALUES (${devViejo}, 'Caja vieja', 'android', 'x', ${bizViejo}, now(), now())`;
      // Refused and resolved 40 days ago: outside the window on every side.
      await sql`
        INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, payload, received_at,
                                     resolved_at, business_id, created_at, updated_at)
        VALUES (${newUlid()}, ${devViejo}, 'sales', ${newUlid()}, 'FK_PRODUCT_MISSING',
                ${sql.json({ preview: 'Venta · Pan ×1' })}, now() - interval '40 days',
                now() - interval '40 days', ${bizViejo}, now(), now())`;
    });
  });

  test('the history says there was no activity in the last 30 days', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-door-owner').click();
    await page.getByTestId('login-email').fill(viejo);
    await page.getByTestId('login-password').fill('sync-viejo-1');
    await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
    await page.goto('/sincronizacion');
    const main = page.locator('main');
    await expect(main.getByText('Últimos 30 días', { exact: true })).toBeVisible();
    await expect(
      main.getByText('Sin actividad de sincronización en los últimos 30 días.'),
    ).toBeVisible();
    await expect(main.getByRole('list', { name: /Historial de sincronización/ })).toHaveCount(0);
  });
});
