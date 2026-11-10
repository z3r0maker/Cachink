import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import postgres from 'postgres';

import type { StaffLogin } from './helpers';

/**
 * The console sweep's own fixtures (gap 11): a staff member of its own, so it
 * never shares a TOTP seed or a lockout with the auth or «Empresa» suites, and
 * one business it mints with exactly the rows its pages are asserted against.
 * The seed is reference data: read, never rewritten.
 */
export const CONSOLA: StaffLogin = {
  email: 'e2e-consola@xangarro.mx',
  password: 'e2e-consola-password-123',
};

/** A name nothing else in the run can take: the pid plus a UUID, never the clock. */
export function stamp(): string {
  return `${process.pid}-${randomUUID().slice(0, 12)}`;
}

const superUrl = (): string => {
  const url = process.env.DATABASE_SUPER_URL ?? '';
  if (url === '') throw new Error('DATABASE_SUPER_URL is not set.');
  return url;
};

export async function withSuper<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(superUrl(), { max: 1, onnotice: () => undefined });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** Everything the member wrote (flag events, overrides, audit) goes with them. */
async function dropConsolaStaff(sql: postgres.Sql): Promise<void> {
  const member = sql`SELECT id FROM staff_members WHERE lower(email) = ${CONSOLA.email}`;
  await sql`DELETE FROM platform_flag_events WHERE updated_by IN (${member})`;
  await sql`DELETE FROM plan_overrides WHERE created_by IN (${member})`;
  await sql`DELETE FROM staff_sessions WHERE staff_id IN (${member})`;
  await sql`DELETE FROM staff_audit_log WHERE staff_id IN (${member})`;
  await sql`DELETE FROM staff_members WHERE lower(email) = ${CONSOLA.email}`;
}

/** A fresh allowlisted member (TOTP enrols through the page, as a first sign-in does). */
export async function resetConsolaStaff(): Promise<void> {
  const hash = await hashPassword(CONSOLA.password);
  await withSuper(async (sql) => {
    await dropConsolaStaff(sql);
    // A ULID-shaped id (Crockford: no I, L, O or U), or the audit log refuses it.
    const id = `01E2C0NS0E2E${randomBytes(9).toString('hex').toUpperCase()}`.slice(0, 26);
    await sql`
      INSERT INTO staff_members (id, email, nombre, password_hash, created_at)
      VALUES (${id}, ${CONSOLA.email}, 'Consola E2E', ${hash}, now())`;
  });
}

export async function clearConsolaStaff(): Promise<void> {
  await withSuper(dropConsolaStaff);
}

/** The minted business and the facts its pages must show. */
export interface ConsolaTenant {
  readonly sello: string;
  readonly biz: string;
  readonly nombre: string;
  readonly ownerEmail: string;
  readonly ownerId: string;
  readonly cajaActiva: string;
  readonly cajaRevocada: string;
  readonly customerId: string;
  /** The subscription's period end: «Próximo cargo». */
  readonly periodEnd: string;
}

function identity(): ConsolaTenant {
  const sello = stamp();
  return {
    sello,
    biz: newUlid(),
    nombre: `Consola E2E ${sello}`,
    ownerEmail: `consola-${sello}@test.mx`,
    ownerId: randomUUID(),
    cajaActiva: `Caja ${sello}`,
    cajaRevocada: `Tablet ${sello}`,
    customerId: `cus_${sello}`.slice(0, 40),
    periodEnd: '2030-03-15T18:00:00.000Z',
  };
}

/**
 * The business: an owner, two devices (one synced an hour ago, one revoked),
 * a Xangarrote subscription, three expenses this month and two the month
 * before — every number the tenant, usage and capacity pages will be held to.
 */
export async function mintConsolaTenant(): Promise<ConsolaTenant> {
  const t = identity();
  await withSuper(async (sql) => {
    await sql`INSERT INTO auth.users (id, email, nombre)
              VALUES (${t.ownerId}::uuid, ${t.ownerEmail}, 'Dueña E2E')`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id,
                              device_id, created_at, updated_at)
      VALUES (${t.biz}, ${t.nombre}, 'RESICO', '626', 125, ${t.biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${t.ownerId}, 'owner', ${t.biz}, now(), now())`;
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, last_push_at, last_pull_at, revoked_at,
                           business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${t.cajaActiva}, 'android', 'Moto G', now() - interval '1 hour',
              now() - interval '1 hour', NULL, ${t.biz}, now(), now()),
             (${newUlid()}, ${t.cajaRevocada}, 'ios', 'iPad', now() - interval '20 days',
              now() - interval '20 days', now() - interval '2 days', ${t.biz}, now(), now())`;
    await sql`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id,
        interval, status, stripe_status, current_period_start, current_period_end,
        collection_method)
      VALUES (${`sub_${t.sello}`.slice(0, 40)}, ${t.biz}, ${t.customerId}, 'xangarrote', 'month',
        'active', 'active', now() - interval '1 day', ${t.periodEnd}::timestamptz,
        'charge_automatically')`;
    const gasto = (ago: string) => sql`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id,
                            device_id, created_at, updated_at)
      VALUES (${newUlid()}, to_char(now() - ${ago}::interval, 'YYYY-MM-DD'), 'Gas E2E',
              'Servicios', 15000, ${t.biz}, 'e2e', now() - ${ago}::interval, now())`;
    for (const ago of ['0 seconds', '0 seconds', '0 seconds', '1 month', '1 month']) {
      await gasto(ago);
    }
  });
  return t;
}

/** Every row the mint and the spec wrote for the business, by its id. */
export async function clearConsolaTenant(t: ConsolaTenant): Promise<void> {
  await withSuper(async (sql) => {
    await sql`DELETE FROM assisted_imports WHERE business_id = ${t.biz}`;
    await sql`DELETE FROM plan_overrides WHERE business_id = ${t.biz}`;
    await sql`DELETE FROM expenses WHERE business_id = ${t.biz}`;
    await sql`DELETE FROM subscriptions WHERE business_id = ${t.biz}`;
    await sql`DELETE FROM devices WHERE business_id = ${t.biz}`;
    await sql`DELETE FROM business_members WHERE business_id = ${t.biz}`;
    await sql`DELETE FROM businesses WHERE id = ${t.biz}`;
    await sql`DELETE FROM auth.users WHERE id = ${t.ownerId}::uuid`;
  });
}
