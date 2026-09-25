import { expect, test, type Page } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { asTenant } from './sync-phone';

/**
 * P-34's «Informe mensual PDF»: on a throwaway **Xangarrote** tenant the button
 * downloads a real PDF (magic %PDF) for the chosen month; the seeded **Xangarro**
 * tenant shows the button (ADR-090 moved the informe down from Xangarrote); on a
 * throwaway **free-plan** tenant the button is hidden and a direct fetch of the
 * route is refused server-side — the capability is checked twice, once per side.
 */
const stamp = randomUUID();
const email = `informe-${stamp}@test.mx`;
const password = 'informe-123';
const biz = newUlid();
const freeEmail = `informe-free-${stamp}@test.mx`;
const freeBiz = newUlid();

const billingUrl = (): string =>
  process.env.BILLING_DATABASE_URL ??
  execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword(password);
  const producto = newUlid();
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password, nombre) VALUES (${userId}::uuid, ${email}, ${hash}, 'Petra')`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, 'Abarrotes Petra', 'RESICO', '626', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
    await sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                            seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
      VALUES (${producto}, 'Despensa', 'Producto Terminado', 100, 'pza', 3, 'producto', false, 500,
              ${biz}, ${biz}, now(), now())`;
    // C-17 (ADR-073): a sale is a ticket line — seed the header it joins to.
    const saleId = newUlid();
    await sql`
      INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                           business_id, device_id, created_at, updated_at)
      VALUES (${saleId}, 1, '2026-04-10', 'Despensa', 'Efectivo', 'pagado',
              ${biz}, ${biz}, now(), now())`;
    await sql`
      INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                         producto_id, cantidad, business_id, device_id, created_at, updated_at)
      VALUES (${saleId}, ${saleId}, '2026-04-10', 'Despensa', 'Producto', 50_000,
              ${producto}, 1, ${biz}, ${biz}, now(), now())`;
  });
  const billing = postgres(billingUrl(), { max: 1, onnotice: () => undefined });
  try {
    await billing`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
        status, stripe_status, current_period_start, current_period_end, collection_method)
      VALUES (${`sub_inf_${stamp}`.slice(0, 40)}, ${biz}, ${`cus_inf_${stamp}`.slice(0, 40)}, 'xangarrote', 'month',
        'active', 'active', now(), '2099-01-01', 'charge_automatically')`;
  } finally {
    await billing.end({ timeout: 5 });
  }
  // The free-plan tenant: same shape, no subscription row — the free plan is
  // the absence of billing (B-10).
  const freeUserId = randomUUID();
  const freeHash = await hashPassword(password);
  await asTenant(freeBiz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password, nombre) VALUES (${freeUserId}::uuid, ${freeEmail}, ${freeHash}, 'Gratuito')`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${freeBiz}, 'Abarrotes Sin Plan', 'RESICO', '626', 125, ${freeBiz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${freeUserId}, 'owner', ${freeBiz}, now(), now())`;
  });
});

async function signInAs(page: Page, userEmail: string): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(userEmail);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

test.describe('Xangarrote (throwaway tenant)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the button downloads the contador PDF for the chosen month', async ({ page }) => {
    await signInAs(page, email);
    await page.goto('/estados?p=mensual');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Informe mensual' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^informe-Abarrotes-Petra-\d{4}-\d{2}\.pdf$/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const bytes = Buffer.concat(chunks);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(bytes.byteLength).toBeGreaterThan(1_000);
  });

  test('the route accepts a named month', async ({ page }) => {
    await signInAs(page, email);
    const response = await page.request.get('/api/export/informe-mensual?mes=2026-04');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
  });
});

test.describe('Xangarro (the seeded tenant)', () => {
  test('shows the informe button since ADR-090', async ({ page }) => {
    await page.goto('/estados');
    await expect(page.getByRole('link', { name: 'Informe mensual' })).toBeVisible();
  });
});

test.describe('Free plan (throwaway tenant)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('no button on Estados, and the route refuses the capability', async ({ page }) => {
    await signInAs(page, freeEmail);
    await page.goto('/estados');
    await expect(page.getByRole('link', { name: 'Informe mensual' })).toHaveCount(0);
    const response = await page.request.get('/api/export/informe-mensual?mes=2026-05');
    expect(response.status()).toBe(403);
  });
});
