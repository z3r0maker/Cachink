import { expect, test, type Page } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import postgres from 'postgres';

import { asTenant } from './sync-phone';

/**
 * P-27's month-end dialog in its missed variant, on throwaway tenants (the
 * `sync` project: it writes rows). April sold $3,000.00 against a $5,000.00
 * goal; the first load of Metas in May closes it lazily and asks what next.
 * A goal closes once, so each choice gets a tenant of its own: «Bajar un
 * nivel» fixes May's goal at the empujón (+10%) over April's real ventas, and
 * «Cambiar» opens the wizard instead.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = randomUUID();
const password = 'cierre-1234';

const billingUrl = (): string =>
  process.env.BILLING_DATABASE_URL ??
  execFileSync('../../packages/data-pg/scripts/db-local.sh', ['billing-url']).toString().trim();

interface Tenant {
  readonly biz: string;
  readonly email: string;
  readonly userId: string;
  readonly member: string;
  readonly producto: string;
  readonly tickets: readonly [string, string];
  readonly meta: string;
}

const tenant = (slug: string): Tenant => ({
  biz: newUlid(),
  email: `cierre-${slug}-${stamp}@test.mx`,
  userId: randomUUID(),
  member: newUlid(),
  producto: newUlid(),
  tickets: [newUlid(), newUlid()],
  meta: newUlid(),
});

// Module-stable ids and idempotent inserts: fullyParallel re-runs the
// file-level beforeAll once per test group, and a re-run is a no-op.
const BAJAR = tenant('bajar');
const CAMBIAR = tenant('cambiar');

async function sembrar(t: Tenant): Promise<void> {
  const hash = await hashPassword(password);
  await asTenant(t.biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${t.userId}::uuid, ${t.email}, ${hash}) ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${t.biz}, 'Jugos Toña', 'RESICO', '626', 125, ${t.biz}, ${newUlid()}, now(), now())
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${t.member}, ${t.userId}, 'owner', ${t.biz}, now(), now())
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                            seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
      VALUES (${t.producto}, 'Jugo', 'Producto Terminado', 100, 'pza', 3, 'producto', false, 500,
              ${t.biz}, ${t.biz}, now(), now())
      ON CONFLICT DO NOTHING`;
    // April sells 150,000 + 150,000: a real base of $3,000.00.
    for (const [i, fecha] of ['2026-04-09', '2026-04-23'].entries()) {
      const id = t.tickets[i as 0 | 1];
      await sql`
        INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                             business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${i + 1}, ${fecha}, 'Jugo', 'Efectivo', 'pagado', ${t.biz}, ${t.biz}, now(), now())
        ON CONFLICT DO NOTHING`;
      await sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${id}, ${fecha}, 'Jugo', 'Producto', 150_000,
                ${t.producto}, 3, ${t.biz}, ${t.biz}, now(), now())
        ON CONFLICT DO NOTHING`;
    }
    // A goal for April that April's $3,000.00 misses.
    await sql`
      INSERT INTO metas (id, objetivo, motivo, nivel, objetivo_centavos, periodo, business_id, created_at, updated_at)
      VALUES (${t.meta}, 'vender', 'comprar', 'reto', 500_000, '2026-04', ${t.biz}, now(), now())
      ON CONFLICT DO NOTHING`;
  });
  // Asesor is a paid-plan screen.
  const billing = postgres(billingUrl(), { max: 1, onnotice: () => undefined });
  try {
    await billing`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
        status, stripe_status, current_period_start, current_period_end, collection_method)
      VALUES (${`sub_cie_${t.biz}`}, ${t.biz}, ${`cus_cie_${t.biz}`}, 'xangarro', 'month',
        'active', 'active', now(), '2099-01-01', 'charge_automatically')
      ON CONFLICT DO NOTHING`;
  } finally {
    await billing.end({ timeout: 5 });
  }
}

test.beforeAll(async () => {
  await sembrar(BAJAR);
  await sembrar(CAMBIAR);
});

async function abrirCierre(page: Page, t: Tenant): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(t.email);
  await page.getByTestId('login-password').fill(password);
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/asesor');
  await page.getByRole('button', { name: 'Metas' }).click();
  await expect(page.getByText('Se cerró tu meta de 2026-04')).toBeVisible();
  await expect(page.getByText('Quedaste en $3,000.00 de $5,000.00')).toBeVisible();
  // No takeover for a missed goal.
  await expect(page.getByText('¡Lograste tu meta!')).toHaveCount(0);
}

test('a missed goal asks what next, and «Bajar un nivel» sets the empujón over April', async ({
  page,
}) => {
  await abrirCierre(page, BAJAR);
  await expect(page.getByRole('button', { name: 'Repetir · +20%' })).toBeVisible();
  await page.getByRole('button', { name: 'Bajar un nivel · +10%' }).click();

  // The dialog reloads the page (back on «Para ti»); Metas holds May's goal:
  // $3,000.00 × 1.10.
  await expect(page.getByRole('button', { name: 'Para ti' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Metas' }).click();
  await expect(page.getByText('Tu meta de 2026-05')).toBeVisible();
  await expect(page.getByText('$3,300.00', { exact: true })).toBeVisible();
  const [meta] = await asTenant(
    BAJAR.biz,
    (sql) =>
      sql<{ nivel: string; objetivo_centavos: string; motivo: string }[]>`
        SELECT nivel, objetivo_centavos::text, motivo FROM metas
        WHERE business_id = ${BAJAR.biz} AND periodo = '2026-05'`,
  );
  expect(meta).toEqual({ nivel: 'empujon', objetivo_centavos: '330000', motivo: 'comprar' });

  // April is a trophy now, and it says it was missed.
  await expect(page.getByText('Metas anteriores')).toBeVisible();
  await expect(page.getByText('No lograda')).toBeVisible();
});

test('«Cambiar» in the month-end dialog opens the wizard, and fixes nothing by itself', async ({
  page,
}) => {
  await abrirCierre(page, CAMBIAR);
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click();
  await expect(page.getByText('¿Qué quieres lograr?')).toBeVisible();
  await expect(page.getByText('Se cerró tu meta de 2026-04')).toHaveCount(0);
  const metas = await asTenant(
    CAMBIAR.biz,
    (sql) => sql`SELECT id FROM metas WHERE business_id = ${CAMBIAR.biz} AND periodo = '2026-05'`,
  );
  expect(metas).toHaveLength(0);
});
