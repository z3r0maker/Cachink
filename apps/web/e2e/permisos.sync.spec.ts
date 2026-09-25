import { expect, test, type Page } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { asTenant } from './sync-phone';

/**
 * P-05's permissions editor on a throwaway **Xangarrote** tenant (the plan
 * that includes per-operator permissions): «Editar permisos» turns on «Puede
 * cancelar ventas», stored as the JSON phones parse and logged for them. The
 * seeded tenant is on Xangarro, where the editor must be absent.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `xangarrote-${stamp}@test.mx`;
const password = 'xangarrote-1';
const biz = newUlid();
const operador = `Beto ${stamp}`;

const billingUrl = (): string =>
  process.env.BILLING_DATABASE_URL ??
  execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword(password);
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Grande ${stamp}`}, 'RESICO', '626', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
  });
  const billing = postgres(billingUrl(), { max: 1, onnotice: () => undefined });
  try {
    await billing`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
        status, stripe_status, current_period_start, current_period_end, collection_method)
      VALUES (${`sub_e2e_${stamp}`}, ${biz}, ${`cus_e2e_${stamp}`}, 'xangarrote', 'month',
        'active', 'active', now(), '2099-01-01', 'charge_automatically')`;
  } finally {
    await billing.end({ timeout: 5 });
  }
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

test('on Xangarrote an operator can be allowed to cancel sales', async ({ page }) => {
  await signIn(page);
  await page.goto('/equipo');
  await page.getByRole('button', { name: 'Nuevo operador' }).click();
  await page.getByTestId('operador-nombre').fill(operador);
  await page.getByTestId('operador-pin').fill('2468');
  await page.getByTestId('operador-pin-confirmar').fill('2468');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('main').getByText(operador)).toBeVisible();

  await page.getByRole('button', { name: 'Editar permisos' }).click();
  await page.getByRole('switch', { name: 'Puede cancelar ventas' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Puede cancelar ventas', { exact: true }).first()).toBeVisible();

  const [row] = await asTenant(
    biz,
    (sql) => sql`
      SELECT u.permissions,
             (SELECT count(*)::int FROM sync_log l WHERE l.table_name = 'users' AND l.row_id = u.id) AS logged
        FROM users u WHERE u.nombre = ${operador}`,
  );
  expect(JSON.parse(String(row?.permissions))).toEqual({ canCancelSales: true });
  expect(row?.logged).toBe(2);
});
