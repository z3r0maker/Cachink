import { expect, test } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * P-11 on a tenant of its own: a refused row names its device and says why in a
 * sentence, the Historial records it, and «Ya lo resolví» is saved:
 * the row stays gone after a reload, with `resolved_at` set.
 */
test.use({ storageState: { cookies: [], origins: [] } });

// Minted in `beforeAll`, not at module scope: CI re-runs the hook against a
// database that may already hold this tenant's rows, so every execution gets a
// business of its own (`mintTenant`).
let t: Tenant;
let rejection = '';

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Sync' });
  rejection = newUlid();
  await asTenant(t.biz, async (sql) => {
    await sql`UPDATE devices SET nombre = 'Caja norte' WHERE id = ${t.deviceId}`;
    await sql`
      INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, payload, received_at,
                                   business_id, created_at, updated_at)
      VALUES (${rejection}, ${t.deviceId}, 'sales', ${newUlid()}, 'FK_PRODUCT_MISSING',
              ${sql.json({ preview: 'Venta · Pan ×2' })}, now(), ${t.biz}, now(), now())`;
  });
});

test('a refused row reads as a sentence, is in the history, and stays resolved', async ({
  page,
}) => {
  await signIn(page, t);
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
    t.biz,
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
  let viejo: Tenant;

  test.beforeAll(async () => {
    viejo = await mintTenant({ label: 'Sync viejo' });
    await asTenant(viejo.biz, async (sql) => {
      await sql`UPDATE devices SET nombre = 'Caja vieja' WHERE id = ${viejo.deviceId}`;
      // Refused and resolved 40 days ago: outside the window on every side.
      await sql`
        INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, payload, received_at,
                                     resolved_at, business_id, created_at, updated_at)
        VALUES (${newUlid()}, ${viejo.deviceId}, 'sales', ${newUlid()}, 'FK_PRODUCT_MISSING',
                ${sql.json({ preview: 'Venta · Pan ×1' })}, now() - interval '40 days',
                now() - interval '40 days', ${viejo.biz}, now(), now())`;
    });
  });

  test('the history says there was no activity in the last 30 days', async ({ page }) => {
    await signIn(page, viejo);
    await page.goto('/sincronizacion');
    const main = page.locator('main');
    await expect(main.getByText('Últimos 30 días', { exact: true })).toBeVisible();
    await expect(
      main.getByText('Sin actividad de sincronización en los últimos 30 días.'),
    ).toBeVisible();
    await expect(main.getByRole('list', { name: /Historial de sincronización/ })).toHaveCount(0);
  });
});
