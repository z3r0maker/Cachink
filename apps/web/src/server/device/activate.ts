import 'server-only';

import {
  ActivateResponseSchema,
  isScanRequest,
  SNAPSHOT_START,
  type ActivateRequest,
  type ActivateResponse,
  type ERROR_CATALOG,
} from '@xangarro/contracts';
import { committedCursor, devices } from '@xangarro/data-pg';
import { newUlid } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import { hashPairingToken } from '../../lib/pairing-token';
import { avisoDeVinculacion } from '../legal/aviso';
import { db, withTenant, type Tx } from '../db';
import { reportError } from '../observability/report';
import { entitlementFor, legacyBootstrapFits, referenceTables } from './bootstrap';
import { assertCredentialsConfigured, mintDeviceToken, signEntitlement } from './credentials';
import { emptyFirstPage, snapshotPage } from './snapshot';

/**
 * A phone joining a business — everything after the HTTP layer.
 *
 * Registration is one transaction. The code is claimed first by
 * `xangarro.redeem_activation_code`, a single UPDATE whose WHERE clause *is*
 * the check, so two concurrent redemptions yield exactly one success. If
 * anything in it throws, the claim rolls back with it: burning a code for a
 * phone that never got its token would strand the shopkeeper. The bootstrap
 * is read after that commit, in its own transaction (C-23, ADR-121), so the
 * business lock is held for the slot count and the insert alone.
 */
export type ActivateErrorCode = keyof typeof ERROR_CATALOG;

/** Thrown inside the transaction to abort it with a contract error. */
export class Refusal extends Error {
  constructor(readonly code: ActivateErrorCode) {
    super(code);
    this.name = 'Refusal';
  }
}

/**
 * The atomic claim, by whichever path the phone used: the typed code + email
 * (`redeem_activation_code`) or the scanned token (`redeem_pairing_token`,
 * C-14 — hashed here, so the token itself never reaches the database).
 */
async function claim(tx: Tx, input: ActivateRequest, deviceId: string): Promise<string> {
  const query = isScanRequest(input)
    ? sql`SELECT outcome, business_id FROM xangarro.redeem_pairing_token(${hashPairingToken(input.qrToken)}, ${deviceId})`
    : sql`SELECT outcome, business_id FROM xangarro.redeem_activation_code(${input.code}, ${input.email}, ${deviceId})`;
  const [row] = await tx.execute<{ outcome: string; business_id: string | null }>(query);
  if (row?.outcome !== 'OK' || row.business_id === null) {
    throw new Refusal((row?.outcome ?? 'CODE_INVALID') as ActivateErrorCode);
  }
  return row.business_id;
}

/**
 * Refuse when the plan's device slots are full (B-12).
 *
 * There are **two** races here, and the code claim only settles one of them.
 * Redeeming the *same* code twice is decided by the atomic UPDATE in
 * `redeem_activation_code`. But two *different* codes for the same business,
 * redeemed at once with one slot left, would each count `limit − 1` active
 * devices and each insert — one phone over the plan. Locking the business row
 * first serialises activations per business, so the count and the insert are
 * atomic with respect to each other. It costs nothing across businesses.
 *
 * A refusal throws inside the transaction, so the code claim rolls back and the
 * shopkeeper's code is still good once a slot is freed.
 */
async function assertSlotFree(tx: Tx, businessId: string, limit: number): Promise<void> {
  await tx.execute(sql`SELECT 1 FROM businesses WHERE id = ${businessId} FOR UPDATE`);
  const [row] = await tx.execute<{ n: string }>(
    sql`SELECT count(*)::text AS n FROM devices WHERE revoked_at IS NULL`,
  );
  if (Number(row?.n ?? 0) >= limit) throw new Refusal('NO_DEVICE_SLOTS');
}

async function registerDevice(
  tx: Tx,
  deviceId: string,
  businessId: string,
  device: ActivateRequest['device'],
  now: string,
  avisoVersion: string | undefined,
): Promise<void> {
  await tx.insert(devices).values({
    id: deviceId,
    nombre: device.name,
    plataforma: device.platform,
    modelo: device.osVersion,
    ...avisoDeVinculacion(avisoVersion),
    businessId,
    createdAt: now,
    updatedAt: now,
  });
}

interface Registered {
  readonly businessId: string;
  readonly entitlement: Awaited<ReturnType<typeof entitlementFor>>;
}

/**
 * The claim and the device row — the only work done under the business lock.
 * An older device (no `bootstrap: 'snapshot'`) whose tenant has outgrown the
 * legacy bootstrap is refused here, before anything is written (C-23).
 */
async function register(
  tx: Tx,
  input: ActivateRequest,
  deviceId: string,
  now: Date,
): Promise<Registered> {
  const businessId = await claim(tx, input, deviceId);
  // Only now is there a tenant. Scope the rest by it, exactly as a request is.
  await tx.execute(sql`SELECT set_config('xangarro.business_id', ${businessId}, true)`);
  const entitlement = await entitlementFor(tx, businessId, now);
  if (input.bootstrap !== 'snapshot' && !(await legacyBootstrapFits(tx))) {
    throw new Refusal('PROTOCOL_UNSUPPORTED');
  }
  await assertSlotFree(tx, businessId, entitlement.limits.devices);
  await registerDevice(
    tx,
    deviceId,
    businessId,
    input.device,
    now.toISOString(),
    input.avisoVersion,
  );
  return { businessId, entitlement };
}

/**
 * What the device starts from, read in its own tenant transaction after the
 * registration committed. The committed cursor is read BEFORE the tables: a
 * write landing between the two is then sent twice (harmless) rather than
 * never (DB-SYNC-01). An opted-in device gets the snapshot's first page; if
 * reading it fails, an empty page pointing at `start` — the code is already
 * spent, so the device must still get its token, and it pulls the snapshot.
 */
async function firstPage(businessId: string, snapshot: boolean, now: Date) {
  const serverTime = now.toISOString();
  if (!snapshot) {
    return withTenant(businessId, async (tx) => {
      const serverSeq = await committedCursor(tx);
      return { serverSeq, serverTime, tables: await referenceTables(tx) };
    });
  }
  try {
    const page = await withTenant(businessId, (tx) => snapshotPage(tx, SNAPSHOT_START, now));
    if (page === null) throw new Error('a snapshot always starts');
    return { serverSeq: page.serverSeq, serverTime, tables: page.tables, snapshot: page.snapshot };
  } catch (error) {
    reportError(error, { endpoint: 'activate', businessId });
    return emptyFirstPage(now);
  }
}

export async function activate(input: ActivateRequest): Promise<ActivateResponse> {
  const deviceId = newUlid();
  const now = new Date();
  // A missing key fails here, before a code is spent on a phone that could
  // never be handed its credentials.
  assertCredentialsConfigured();
  // The lock on the business row lasts from the slot count to this commit —
  // no bootstrap read, no parse, no signature inside it (audit DB3-BOOT-01).
  const { businessId, entitlement } = await db().transaction((tx) =>
    register(tx as Tx, input, deviceId, now),
  );
  const [bootstrap, deviceToken, signed] = await Promise.all([
    firstPage(businessId, input.bootstrap === 'snapshot', now),
    mintDeviceToken(businessId, deviceId),
    signEntitlement(entitlement),
  ]);
  // Parsed, not cast. The server validates its own response against the
  // contract before sending it, so a future schema drift — a new JSON column,
  // a renamed field — fails here with a precise error instead of shipping a
  // payload the phone rejects. `wireSchema` accepts real bigints for exactly
  // this in-process use.
  return ActivateResponseSchema.parse({
    deviceToken,
    deviceId,
    businessId,
    entitlement: signed,
    bootstrap,
  });
}
