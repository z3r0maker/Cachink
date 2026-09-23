/**
 * Seed — "Tacos La Esquina", the App Review tenant (B-04, X-05).
 *
 * Separate from the dev seed and runnable against the hosted project: a store
 * reviewer signs in as `demo@xangarro.mx`, pairs a phone with `DEMXK7M3`,
 * and finds a month of ventas and gastos. Idempotent by upsert — the app
 * role cannot DELETE since 0036 (DB-RLS-01), so a re-run keeps the rows it
 * already wrote and only re-mints the activation code; it never wipes. The
 * owner's password is set on the **first** run only: the app role cannot
 * rewrite `auth.users` (`account_create` refuses a taken address, and
 * `password_reset` needs a link), which is also what review notes want — a
 * password that does not change under the reviewer. To rotate it, use the
 * portal's reset link.
 *
 *   pnpm --filter @xangarro/data-pg db:seed:demo                   # local
 *   DATABASE_URL=… BILLING_DATABASE_URL=… DEMO_OWNER_PASSWORD=… \
 *     pnpm --filter @xangarro/data-pg exec tsx scripts/seed-demo.ts  # hosted, before each submission
 *
 * Runs through the **app role** (RLS-bound), the billing row through the
 * billing role — the same paths a request takes.
 */
import { hash } from 'bcryptjs';
import postgres, { type Sql } from 'postgres';
import { fileURLToPath } from 'node:url';

import { createDb } from '../src/client';
import { saveSubscriptionRow } from '../src/queries/billing';
import { DEMO, DEMO_CLIENTS, DEMO_PRODUCTS, demoId } from './seed-demo-data.js';
import { seedDemoGastos, seedDemoOpeningStock, seedDemoVentas } from './seed-demo-ledger.js';

const CREATED = '2026-01-15T15:00:00.000Z';
const CODE_DAYS = 365;

async function seedBusiness(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
    VALUES (${DEMO.businessId}, ${DEMO.nombre}, 'RESICO', '626', 125, ${DEMO.businessId}, ${DEMO.deviceId}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`;
}

async function seedProducts(sql: Sql): Promise<void> {
  for (const [suffix, nombre, sku, costo, precio, icono] of DEMO_PRODUCTS) {
    await sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                            seguir_stock, precio_venta_centavos, icono, business_id, device_id, created_at, updated_at)
      VALUES (${demoId(suffix)}, ${nombre}, ${sku}, 'Producto Terminado', ${costo}, 'pza', 5, 'producto',
              true, ${precio}, ${icono}, ${DEMO.businessId}, ${DEMO.deviceId}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
}

async function seedClients(sql: Sql): Promise<void> {
  for (const [suffix, nombre, telefono, limite, plazo] of DEMO_CLIENTS) {
    await sql`
      INSERT INTO clients (id, nombre, telefono, limite_centavos, plazo_dias, business_id, device_id, created_at, updated_at)
      VALUES (${demoId(suffix)}, ${nombre}, ${telefono}, ${limite}, ${plazo}, ${DEMO.businessId}, ${DEMO.deviceId}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
}

/** Two registers with the PINs the review notes state (ADR-072: four digits). */
async function seedOperators(sql: Sql): Promise<void> {
  for (const op of DEMO.operators) {
    const pin = await hash(op.pin, 10);
    await sql`
      INSERT INTO users (id, nombre, pin_hash, avatar_color, permissions, active, business_id, device_id, created_at, updated_at)
      VALUES (${op.id}, ${op.nombre}, ${pin}, ${op.color}, '{"canCancelSales":true}', true,
              ${DEMO.businessId}, ${DEMO.deviceId}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, active = true`;
  }
}

/** The owner: identity through `xangarro.account_create` (B-01); the password sticks after the first run. */
async function seedOwner(sql: Sql, password: string): Promise<void> {
  const o = DEMO.owner;
  const encrypted = await hash(password, 10);
  await sql`SELECT xangarro.account_create(${o.id}::uuid, ${o.email}, ${encrypted}, ${o.nombre}, ${CREATED})`;
  await sql`
    INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
    VALUES (${o.memberId}, ${o.id}, 'owner', ${DEMO.businessId}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
}

/** Re-minted on every run: a reviewer's redeemed code is live again for the next reviewer. */
async function seedActivationCode(sql: Sql, today: Date): Promise<void> {
  const expires = new Date(today.getTime() + CODE_DAYS * 86_400_000).toISOString();
  await sql`
    INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
    VALUES (${DEMO.activationCode}, ${DEMO.owner.email}, ${expires}, ${DEMO.businessId}, now(), now())
    ON CONFLICT (code) DO UPDATE SET expires_at = EXCLUDED.expires_at, redeemed_at = NULL,
      redeemed_by_device_id = NULL, updated_at = now()`;
}

export interface SeedDemoOptions {
  readonly password: string;
  readonly today?: Date;
}

export interface SeedDemoSummary {
  readonly ventas: number;
  readonly gastos: number;
}

/** Everything the tenant needs, through the app connection; the caller owns `sql`. */
export async function seedDemo(sql: Sql, options: SeedDemoOptions): Promise<SeedDemoSummary> {
  const today = options.today ?? new Date();
  await sql`SELECT set_config('xangarro.business_id', ${DEMO.businessId}, false)`;
  await seedBusiness(sql);
  await seedProducts(sql);
  await seedClients(sql);
  await seedOperators(sql);
  await seedOwner(sql, options.password);
  await seedActivationCode(sql, today);
  await seedDemoOpeningStock(sql, today);
  const ventas = await seedDemoVentas(sql, today);
  const gastos = await seedDemoGastos(sql, today);
  return { ventas, gastos };
}

/** The Xangarro plan, so the reviewer sees a paid tier's screens (through the billing role). */
export async function seedDemoBilling(billingUrl: string): Promise<void> {
  const db = createDb(billingUrl);
  try {
    await saveSubscriptionRow(db, {
      stripeSubscriptionId: 'sub_seed_demo_review',
      businessId: DEMO.businessId,
      stripeCustomerId: 'cus_seed_demo_review',
      planId: 'xangarro',
      interval: 'month',
      status: 'active',
      stripeStatus: 'active',
      trialEnd: null,
      currentPeriodStart: '2026-01-15T00:00:00.000Z',
      currentPeriodEnd: '2099-01-01T00:00:00.000Z',
      cancelAt: null,
      collectionMethod: 'charge_automatically',
    });
  } finally {
    await db.$client.end({ timeout: 5 });
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.error(`${name} is required (see docs/ops/provisioning.md, "Demo tenant").`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const url = required('DATABASE_URL');
  const billingUrl = required('BILLING_DATABASE_URL');
  const password = required('DEMO_OWNER_PASSWORD');
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  const started = Date.now();
  try {
    const { ventas, gastos } = await seedDemo(sql, { password });
    await seedDemoBilling(billingUrl);
    console.log(
      `seeded ${DEMO.nombre} — ${DEMO_PRODUCTS.length} productos, ${ventas} ventas, ${gastos} gastos, ` +
        `${DEMO.operators.length} operadores, código ${DEMO.activationCode}, owner ${DEMO.owner.email} (${Date.now() - started} ms)`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) void main();
