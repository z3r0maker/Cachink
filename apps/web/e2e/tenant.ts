import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { billingDatabaseUrl } from './db-url';
import { asTenant } from './sync-phone';
import type { Page } from './test';

/**
 * A tenant of its own, for a spec that writes.
 *
 * The seeded tenant — Taquería Don Pedro — is **reference data**: specs read
 * its ledger and assert its figures, and ADR-103's trigger refuses writes to it
 * while the viewport projects run. Everything that needs to write mints its own
 * business here instead, which is what makes a spec's data its own and nobody
 * else's.
 *
 * This replaces seventeen hand-rolled `beforeAll` fixtures that each inserted
 * the same four rows (auth user, business, membership, device) and each got the
 * details slightly differently — seven idioms for the unique stamp alone, two
 * of them `Date.now()`, which is how CI kept hitting
 * `duplicate key value violates unique constraint "users_email_key"`: two
 * workers starting inside the same millisecond mint the same address.
 */
export type Plan = 'free' | 'xangarrito' | 'xangarro' | 'xangarrote';

export interface Tenant {
  /** The business id, which is also its `business_id` and its RLS key. */
  readonly biz: string;
  readonly nombre: string;
  readonly email: string;
  readonly password: string;
  readonly ownerId: string;
  /** The device every row this tenant writes is attributed to. */
  readonly deviceId: string;
}

/**
 * A name nothing else in the run can take.
 *
 * Never `Date.now()`: the millisecond is shared by however many workers start
 * together, and `tests/e2e-fixture-identity.test.ts` holds that line.
 */
export function stamp(): string {
  return `${process.pid}-${randomUUID().slice(0, 12)}`;
}

/**
 * A client address this process alone uses.
 *
 * The sign-in and activation throttles key on the caller's IP, so two workers
 * sharing one address throttle each other. The pid is unique within a run, and
 * the run resets the throttle table anyway.
 */
export function clientIp(): string {
  return `203.0.113.${1 + (process.pid % 250)}`;
}

export interface MintOptions {
  /** Shows up in the business name and the owner's address: «Fonda», «Sync». */
  readonly label?: string;
  readonly role?: 'owner' | 'admin' | 'viewer';
  /** `free` writes no subscription row at all — the free plan is its absence (B-10). */
  readonly plan?: Plan;
  readonly regimenFiscal?: string;
  readonly regimenSat?: string;
  /** Hundredths of a percent, as the column stores it: 125 is 1.25%. */
  readonly isrTasa?: number;
  /**
   * An account that already exists: the new business becomes another of its
   * memberships rather than a new owner's. What the switcher is about — one
   * person, two businesses, a role in each.
   */
  readonly owner?: Pick<Tenant, 'ownerId' | 'email' | 'password'>;
  /**
   * Seconds added to the membership's `created_at`. The membership lookup
   * orders by it, so this is how a spec says which business comes first.
   */
  readonly joinedAfter?: number;
  /** Anything but `active` also moves the period, as Stripe would. */
  readonly status?: Status;
  /** Cancelled at period end (LFPC 76 Bis): `cancel_at` is the period's end, as Stripe sets it. */
  readonly cancelando?: boolean;
}

/** The subscription id `mintTenant` gave the tenant's row. */
export const subscriptionIdOf = (t: Pick<Tenant, 'biz'>): string =>
  `sub_${`${t.biz}`.slice(-12)}`.slice(0, 40);

/** What Stripe would say about the subscription: the screens read this, not us. */
export type Status = 'active' | 'past_due' | 'canceled' | 'trialing';

/** The plan's subscription row, in the billing database. */
async function subscribe(
  biz: string,
  plan: Exclude<Plan, 'free'>,
  sello: string,
  status: Status,
  cancelando = false,
): Promise<void> {
  const sql = postgres(billingDatabaseUrl(), { max: 1, onnotice: () => undefined });
  try {
    await sql`
      INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id,
        interval, status, stripe_status, current_period_start, current_period_end, collection_method)
      VALUES (${`sub_${sello}`.slice(0, 40)}, ${biz}, ${`cus_${sello}`.slice(0, 40)}, ${plan},
        'month', ${status}, ${status},
        ${status === 'past_due' ? sql`now() - interval '1 month'` : sql`now() - interval '1 day'`},
        ${status === 'past_due' ? sql`now() + interval '2 days'` : sql`now() + interval '1 month'`},
        'charge_automatically')`;
    if (cancelando) {
      await sql`UPDATE subscriptions SET cancel_at = current_period_end
                WHERE stripe_subscription_id = ${`sub_${sello}`.slice(0, 40)}`;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/**
 * Mints an owner, a business, the membership between them and one device.
 *
 * Everything else a spec needs — products, sales, operators, a second device —
 * composes onto it from `tenant-rows.ts`, so a fixture reads as the handful of
 * rows the test is actually about.
 */
/** The business, its name and the account that will own it. */
function identity(label: string, owner: MintOptions['owner']): Tenant {
  const sello = stamp();
  const slug = label.toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    biz: newUlid(),
    nombre: `${label} ${sello}`,
    email: owner?.email ?? `${slug}-${sello}@test.mx`,
    password: owner?.password ?? `${slug}-2026`,
    ownerId: owner?.ownerId ?? randomUUID(),
    deviceId: newUlid(),
  };
}

export async function mintTenant(options: MintOptions = {}): Promise<Tenant> {
  const { label = 'Negocio', role = 'owner', plan = 'xangarro' } = options;
  const t = identity(label, options.owner);
  const hash = await hashPassword(t.password);
  await asTenant(t.biz, async (sql) => {
    if (options.owner === undefined) {
      await sql`
        INSERT INTO auth.users (id, email, encrypted_password, nombre)
        VALUES (${t.ownerId}::uuid, ${t.email}, ${hash}, ${label})`;
    }
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id,
                              device_id, created_at, updated_at)
      VALUES (${t.biz}, ${t.nombre}, ${options.regimenFiscal ?? 'RESICO'},
              ${options.regimenSat ?? '626'}, ${options.isrTasa ?? 125}, ${t.biz}, ${t.deviceId},
              now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${t.ownerId}, ${role}, ${t.biz},
              now() + ${`${options.joinedAfter ?? 0} seconds`}::interval, now())`;
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
      VALUES (${t.deviceId}, 'Caja única', 'android', 'Moto G', ${t.biz}, now(), now())`;
  });
  if (plan !== 'free') {
    await subscribe(
      t.biz,
      plan,
      `${t.biz}`.slice(-12),
      options.status ?? 'active',
      options.cancelando === true,
    );
  }
  return t;
}

/**
 * A second account in the same business, with a role of its own.
 *
 * The specs about roles need two people in one business — an owner who writes
 * and a viewer who must not — and the viewer is an account, not a tenant.
 */
export async function addMember(
  t: Tenant,
  options: { readonly role?: 'owner' | 'admin' | 'viewer'; readonly label?: string } = {},
): Promise<Pick<Tenant, 'ownerId' | 'email' | 'password'>> {
  const { role = 'viewer', label = 'lectura' } = options;
  const member = {
    ownerId: randomUUID(),
    email: `${label}-${stamp()}@test.mx`,
    password: `${label}-2026`,
  };
  const hash = await hashPassword(member.password);
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO auth.users (id, email, encrypted_password, nombre)
      VALUES (${member.ownerId}::uuid, ${member.email}, ${hash}, ${label})`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${member.ownerId}, ${role}, ${t.biz}, now(), now())`;
  });
  return member;
}

/**
 * Fills the owner's door and presses it — without claiming it opens.
 *
 * For the specs whose subject is a refusal: an archived business, a locked
 * address. `signIn` is the same walk plus the landing.
 */
export async function submitSignIn(
  page: Page,
  t: Pick<Tenant, 'email' | 'password'>,
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(t.email);
  await page.getByTestId('login-password').fill(t.password);
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
}

/** Through the real door, as its owner, and inside. */
export async function signIn(page: Page, t: Pick<Tenant, 'email' | 'password'>): Promise<void> {
  await submitSignIn(page, t);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}
