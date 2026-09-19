import { expect, test, type Page } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';

import { asTenant } from './sync-phone';

/**
 * P-27/P-33 on a throwaway tenant (the `sync` project: it writes rows). April
 * has ventas to anchor a base; a May-loaded goal for April closes lazily on
 * the Metas tab — achieved, so the takeover appears **once** (ADR-086's
 * marker), the month-end dialog answers in its lograda variant, and the next
 * wizard run anchors to April's real ventas.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = randomUUID();
const email = `metas-${stamp}@test.mx`;
const password = 'metas-1234';
const biz = newUlid();

const billingUrl = (): string =>
  process.env.BILLING_DATABASE_URL ??
  execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();

test.beforeAll(async () => {
  const ownerId = randomUUID();
  const viewerId = randomUUID();
  const ownerHash = await hashPassword(password);
  const viewerHash = await hashPassword(password);
  const producto = newUlid();
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${ownerId}::uuid, ${email}, ${ownerHash})`;
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${viewerId}::uuid, ${`lectura-${stamp}@test.mx`}, ${viewerHash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, 'Carnitas Chela', 'RESICO', '626', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${ownerId}, 'owner', ${biz}, now(), now()),
             (${newUlid()}, ${viewerId}, 'viewer', ${biz}, now(), now())`;
    await sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                            seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
      VALUES (${producto}, 'Torta', 'Producto Terminado', 100, 'pza', 3, 'producto', false, 500,
              ${biz}, ${biz}, now(), now())`;
    for (const f of ['2026-04-05', '2026-04-18', '2026-04-27']) {
      await sql`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${newUlid()}, ${f}, 'Torta', 'Producto', 100_000, 'Efectivo', 'pagado',
                ${producto}, 2, ${biz}, ${biz}, now(), now())`;
    }
    // A goal for April that April's 300,000 beats: lograda on the lazy close.
    await sql`
      INSERT INTO metas (id, objetivo, motivo, nivel, objetivo_centavos, periodo, business_id, created_at, updated_at)
      VALUES (${newUlid()}, 'vender', 'comprar', 'reto', 280_000, '2026-04', ${biz}, now(), now())`;
  });
  const billing = postgres(billingUrl(), { max: 1, onnotice: () => undefined });
  try {
    await billing`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
        status, stripe_status, current_period_start, current_period_end, collection_method)
      VALUES (${`sub_met_${stamp}`.slice(0, 40)}, ${biz}, ${`cus_met_${stamp}`.slice(0, 40)}, 'xangarro', 'month',
        'active', 'active', now(), '2099-01-01', 'charge_automatically')`;
  } finally {
    await billing.end({ timeout: 5 });
  }
});

async function signIn(page: Page, address: string): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(address);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

const abrirMetas = async (page: Page) => {
  await page.goto('/asesor');
  await page.getByRole('button', { name: 'Metas' }).click();
};

test('an achieved goal celebrates once, then the month-end dialog answers in its lograda variant', async ({
  page,
}) => {
  await signIn(page, email);
  await abrirMetas(page);

  // The takeover, once (P-33)…
  const takeover = page.getByRole('dialog');
  await expect(takeover.getByRole('heading', { name: '¡Lograste tu meta!' })).toBeVisible();
  await takeover.getByRole('button').first().click();
  await expect(takeover).toBeHidden();

  // …and never again: the marker was written the moment it rendered.
  await abrirMetas(page);
  await expect(page.getByText('¡Lograste tu meta!')).toHaveCount(0);

  // The wizard anchors to April's real 300,000 (×1.2 = 360,000 for «un reto»).
  await expect(page.getByText('¿Qué quieres lograr?')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('$3,600.00 al mes · $120.00 al día')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar mi meta' }).click();
  await expect(page.getByText('Tu meta de 2026-05')).toBeVisible();
  await expect(page.getByText('$3,600.00')).toBeVisible();
});

test('a viewer never sees the wizard', async ({ page }) => {
  await signIn(page, `lectura-${stamp}@test.mx`);
  await abrirMetas(page);
  await expect(page.getByText('¿Qué quieres lograr?')).toHaveCount(0);
  await expect(page.getByText('Solo lectura')).toBeVisible();
});
