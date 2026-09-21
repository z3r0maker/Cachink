import { expect, test } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { asTenant } from './sync-phone';

/**
 * P-10's «Facturas» (N-33) on a throwaway owner without fiscal data: a
 * payment in the monthly global CFDI points to Negocio, a pending one says it
 * arrives by email, and one invoiced by hand shows its UUID.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const email = `facturas-${randomUUID()}@test.mx`;
const biz = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('facturas-1');
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Facturas ${Date.now()}`}, 'RESICO', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
  });
  const url =
    process.env.BILLING_DATABASE_URL ??
    execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();
  const billing = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const pago = (status: string, route: string, dia: string, uuid: string | null) => billing`
      INSERT INTO cfdi_payments (external_payment_id, business_id, route, status, total_centavos, paid_at,
                                 period, forma_pago, description, invoice_uuid)
      VALUES (${`in_e2e_${randomUUID()}`}, ${biz}, ${route}, ${status}, 34800, ${dia}, '2026-05', '04',
              'Plan Xangarro', ${uuid})`;
    await pago('in_global', 'global', '2026-05-01T18:00:00Z', null);
    await pago('manual', 'individual', '2026-04-01T18:00:00Z', null);
    await pago(
      'stamped',
      'individual',
      '2026-03-01T18:00:00Z',
      'AAAAAAAA-1111-2222-3333-444444444444',
    );
  } finally {
    await billing.end({ timeout: 5 });
  }
});

test('each payment shows the state of its factura', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('facturas-1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/suscripcion');

  const lista = page.getByRole('list', { name: 'Facturas' }).getByRole('listitem');
  await expect(lista).toHaveCount(3);
  await expect(lista.nth(0)).toContainText('En la factura global del mes');
  await expect(
    lista
      .nth(0)
      .getByRole('link', { name: 'Completa tus datos fiscales para facturar a tu nombre' }),
  ).toBeVisible();
  await expect(lista.nth(1)).toContainText('Tu factura se enviará a tu correo');
  await expect(lista.nth(2)).toContainText('Emitida · UUID AAAAAAAA-1111-2222-3333-444444444444');
  await expect(lista.nth(0)).toContainText('$348.00');
});
