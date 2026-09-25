import { expect, test } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { asTenant } from './sync-phone';

/**
 * P-10: the status comes from Stripe's stored subscription, the consumption is
 * the business's own, the owner gets the billing buttons and nobody else does,
 * and a past-due subscription shows its grace in plain words.
 */
test('the owner sees the real status, the entitlement line and the billing buttons', async ({
  page,
}) => {
  await page.goto('/suscripcion');
  const main = page.locator('main');
  await expect(main.getByTestId('suscripcion-estado')).toHaveText(/^Siguiente cobro: /);
  await expect(main.getByTestId('entitlement-debug')).toContainText('el plan Xangarro');
  await expect(main.getByRole('button', { name: 'Administrar pago' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Este es tu plan' })).toBeDisabled();
  await expect(main.getByRole('button', { name: 'Cambiar a Xangarrito' })).toBeVisible();
});

/** N-01: the annual switch shows the two-months-free prices, and SPEI is offered
 * on annual only, for a paid plan that is not the current one. */
test('the annual switch shows annual prices and offers SPEI', async ({ page }) => {
  await page.goto('/suscripcion');
  const main = page.locator('main');
  await expect(main.getByTestId('precio-xangarro')).toContainText('199');
  await expect(main.getByRole('button', { name: /Pagar por transferencia/ })).toHaveCount(0);
  await expect(main.getByRole('button', { name: /Cambiar a anual/ })).toBeVisible();

  await main
    .getByRole('group', { name: 'Periodo de pago' })
    .getByRole('button', { name: /Anual/ })
    .click();
  await expect(main.getByTestId('precio-xangarro')).toContainText('1,990');
  await expect(main.getByTestId('precio-xangarrote')).toContainText('3,990');
  await expect(main.getByText('MXN / año + IVA').first()).toBeVisible();
  // Xangarro is Taquería's own plan, so only Xangarrote gets the SPEI button.
  await expect(main.getByRole('button', { name: /Pagar por transferencia/ })).toHaveCount(1);
});

test.describe('past due, seen by a viewer', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const email = `pago-${randomUUID()}@test.mx`;
  const biz = newUlid();

  test.beforeAll(async () => {
    const userId = randomUUID();
    const hash = await hashPassword('pago-1234');
    await asTenant(biz, async (sql) => {
      await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
      await sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${biz}, ${`Pago ${Date.now()}`}, 'RESICO', 125, ${biz}, ${newUlid()}, now(), now())`;
      await sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${newUlid()}, ${userId}, 'viewer', ${biz}, now(), now())`;
    });
    const url =
      process.env.BILLING_DATABASE_URL ??
      execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();
    const billing = postgres(url, { max: 1, onnotice: () => undefined });
    try {
      await billing`
        INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
          status, stripe_status, current_period_start, current_period_end, collection_method)
        VALUES (${`sub_pd_${Date.now()}`}, ${biz}, ${`cus_pd_${Date.now()}`}, 'xangarro', 'month',
          'past_due', 'past_due', now() - interval '1 month', now() + interval '2 days', 'charge_automatically')`;
    } finally {
      await billing.end({ timeout: 5 });
    }
  });

  test('the grace period is said plainly, and a viewer gets no billing buttons', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByTestId('login-door-owner').click();
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('pago-1234');
    await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
    await page.goto('/suscripcion');
    const main = page.locator('main');
    await expect(main.getByText('Tu último pago no pasó.')).toBeVisible();
    await expect(main.getByText(/7 días de gracia/)).toBeVisible();
    await expect(main.getByRole('button', { name: 'Administrar pago' })).toHaveCount(0);
    await expect(main.getByRole('button', { name: 'Cambiar a Xangarrito' })).toHaveCount(0);
    await expect(main.getByRole('button', { name: /Probar|Contratar|Crear cuenta/ })).toHaveCount(
      0,
    );
  });
});
