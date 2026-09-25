import { expect, test } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { filledAll } from './interact';
import { asTenant } from './sync-phone';

/**
 * N-17's end-to-end acceptance on a throwaway owner with no sales: the
 * opening caja and bancos captured in /saldos-iniciales are exactly the
 * Balance's «Efectivo», and «¿Cómo empiezo?» ticks its saldos row by itself.
 */
test.use({ storageState: { cookies: [], origins: [] } });

// A fresh address per *process*, not per millisecond: this file's `beforeAll`
// runs once in every viewport project, and three of them starting inside the
// same millisecond gave `Date.now()` the same value and the second insert a
// duplicate `users_email_key`. `onboarding.spec.ts` already carries a patch
// for the same collision.
const sello = randomUUID();
const email = `saldos-${sello}@test.mx`;
const biz = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('saldos-123');
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Saldos ${sello}`}, 'RESICO', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
  });
  // Estados is a paid-plan screen, so the tenant pays for Xangarro.
  const url =
    process.env.BILLING_DATABASE_URL ??
    execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();
  const billing = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await billing`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
        status, stripe_status, current_period_start, current_period_end, collection_method)
      VALUES (${`sub_saldos_${sello}`}, ${biz}, ${`cus_saldos_${sello}`}, 'xangarro', 'month',
        'active', 'active', now() - interval '1 day', now() + interval '1 month', 'charge_automatically')`;
  } finally {
    await billing.end({ timeout: 5 });
  }
});

test('captured opening cash is the Balance’s Efectivo, and the checklist ticks itself', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one throwaway tenant, one run');
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('saldos-123');
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  await page.goto('/como-empiezo');
  const row = page
    .getByTestId('checklist')
    .locator('li', { hasText: 'Captura tus saldos iniciales' });
  await expect(row).toHaveAttribute('data-done', 'false');

  await page.goto('/saldos-iniciales');
  // Day one of the seed's month (PORTAL_TODAY is 2026-05-12). Filled as one
  // form and read back as one: the fecha used to go blank when the caja's fill
  // woke the component up, and the save answered «Revisa estos datos:
  // fechaApertura» about a field this test had typed.
  await filledAll([
    [page.getByLabel('Fecha de apertura'), '2026-05-01'],
    [page.getByLabel('Caja (efectivo)'), '5000'],
    [page.getByLabel('Bancos'), '12000'],
  ]);
  await page.getByRole('button', { name: 'Guardar saldos' }).click();
  await expect(page.getByText('Saldos guardados.')).toBeVisible();

  await page.goto('/estados');
  await page.getByRole('button', { name: 'Posición' }).click();
  const efectivo = page
    .locator('main')
    .getByText('Efectivo', { exact: true })
    .locator('xpath=ancestor::*[1]/..');
  await expect(efectivo).toContainText('$17,000.00');

  await page.goto('/como-empiezo');
  await expect(row).toHaveAttribute('data-done', 'true');
});
