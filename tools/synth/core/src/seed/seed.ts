import {
  addMember,
  addOperator,
  addProduct,
  addSale,
  appDatabaseUrl,
  billingDatabaseUrl,
  mintCodeFor,
  mintTenant,
  stamp,
  superDatabaseUrl,
  type Tenant,
} from '@xangarro/testing/tenant';
import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import type { z } from 'zod';

import type { AuthAs, Seed } from '../schemas/common';
import { StackError } from '../stack/errors';
import { assertLocalUrl } from '../stack/hosts';
import { FIXTURES, historyDates, type FixturePlan } from './fixtures';

/**
 * `seed.ts` (S-04): one fresh tenant per run (ADR-153 §3), with what its
 * scenario's seed asks for, and the access the actor signs in with. It writes
 * through `@xangarro/testing/tenant` to the database the corrida's stack set in
 * the environment, and refuses any host outside `allowed_hosts` first.
 */
export interface SeededOperator {
  readonly id: string;
  readonly nombre: string;
  /** A test NIP, given to the actor as its persona's own. */
  readonly nip: string;
}

/** What signs in: an email and a test password. */
export interface RunAccount {
  readonly email: string;
  readonly password: string;
}

export interface RunAccess {
  /** Null for `sin-cuenta`: the actor's signup makes the business, found by `account.email`. */
  readonly tenant: Tenant | null;
  /**
   * Who signs in at `/login`: the owner, or a member with the scenario's role.
   * For `sin-cuenta`, the address and password the actor signs up with.
   */
  readonly account: RunAccount;
  readonly operators: readonly SeededOperator[];
  /** For an `operador` scenario: the code that links the browser or phone as a device. */
  readonly activationCode: string | null;
}

export interface SeedOptions {
  readonly seed: z.infer<typeof Seed>;
  readonly authAs: z.infer<typeof AuthAs>;
  /** The server's business day: history ends the day before it. */
  readonly today: string;
  readonly allowedHosts: readonly string[];
  /** Shows up in the business name; the persona's id reads well. */
  readonly label?: string;
}

async function seedOperators(t: Tenant, plan: FixturePlan): Promise<SeededOperator[]> {
  const out: SeededOperator[] = [];
  for (const op of plan.operators) {
    const pinHash = await bcrypt.hash(op.nip, 10);
    const id = await addOperator(t, {
      nombre: op.nombre,
      pinHash,
      permissions: { canCancelSales: op.canCancelSales },
    });
    out.push({ id, nombre: op.nombre, nip: op.nip });
  }
  return out;
}

async function seedHistory(
  t: Tenant,
  plan: FixturePlan,
  products: readonly string[],
  today: string,
) {
  let folio = 0;
  for (const fecha of historyDates(today, plan.history.days)) {
    for (let k = 0; k < plan.history.perDay; k += 1) {
      folio += 1;
      const i = folio % products.length;
      const product = plan.products[i];
      const productoId = products[i];
      if (product === undefined || productoId === undefined) continue;
      const cantidad = 1 + (folio % 3);
      await addSale(t, {
        fecha,
        monto: product.precio * cantidad,
        concepto: product.nombre,
        folio,
        productoId,
        cantidad,
      });
    }
  }
}

function assertHosts(allowed: readonly string[]): void {
  for (const url of [appDatabaseUrl(), billingDatabaseUrl(), superDatabaseUrl()])
    assertLocalUrl(url, allowed);
}

async function accountFor(t: Tenant, authAs: SeedOptions['authAs']): Promise<RunAccount> {
  if (authAs === 'admin' || authAs === 'viewer')
    return addMember(t, { role: authAs, label: authAs });
  return t;
}

/** The run's seeded tenant; throws for `sin-cuenta`, whose runner has none to give a door. */
export function seededTenant(access: RunAccess): Tenant {
  if (access.tenant === null) {
    throw new StackError('SEED_UNKNOWN', 'this run starts with no account: the actor signs up');
  }
  return access.tenant;
}

/** A signup's own address and password: test values, unique per run so throttles stay apart. */
function signupAccess(label: string): RunAccess {
  const slug = label.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'synth';
  return {
    tenant: null,
    account: {
      email: `${slug}-${stamp()}@ejemplo.mx`,
      password: `synth-${randomBytes(4).toString('hex')}`,
    },
    operators: [],
    activationCode: null,
  };
}

export async function seedRun(o: SeedOptions): Promise<RunAccess> {
  const plan = FIXTURES[o.seed];
  if (plan === undefined) throw new StackError('SEED_UNKNOWN', `no seed «${o.seed}»`);
  if (plan.signup === true) {
    // Nothing is written, but success is read from this database afterwards.
    assertHosts(o.allowedHosts);
    return signupAccess(o.label ?? 'synth');
  }
  if (o.authAs === 'operador' && plan.operators.length === 0) {
    throw new StackError(
      'SEED_UNKNOWN',
      `«${o.seed}» has no operator for an «operador» scenario to sign in as`,
    );
  }
  assertHosts(o.allowedHosts);
  const tenant = await mintTenant({ label: o.label ?? 'Synth', plan: plan.plan });
  const products: string[] = [];
  for (const p of plan.products) {
    products.push(
      await addProduct(tenant, {
        nombre: p.nombre,
        sku: p.sku,
        precio: p.precio,
        costo: p.costo,
        // Not tracked: a tracked product with no stock shows «Quedan 0» in red,
        // which the first run read as a problem with the app. A seed that is
        // about inventory adds stock and turns tracking on.
        seguirStock: false,
      }),
    );
  }
  const operators = await seedOperators(tenant, plan);
  await seedHistory(tenant, plan, products, o.today);
  const activationCode = o.authAs === 'operador' ? await mintCodeFor(tenant) : null;
  return { tenant, account: await accountFor(tenant, o.authAs), operators, activationCode };
}
