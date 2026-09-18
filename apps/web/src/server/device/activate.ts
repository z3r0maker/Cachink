import 'server-only';

import {
  ActivateResponseSchema,
  type ActivateRequest,
  type ActivateResponse,
  type ERROR_CATALOG,
} from '@xangarro/contracts';
import { committedCursor, devices } from '@xangarro/data-pg';
import { newUlid } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import { db, type Tx } from '../db';
import { entitlementFor, referenceTables } from './bootstrap';
import { mintDeviceToken, signEntitlement } from './credentials';

/**
 * A phone joining a business — everything after the HTTP layer.
 *
 * One transaction. The code is claimed first by
 * `xangarro.redeem_activation_code`, a single UPDATE whose WHERE clause *is*
 * the check, so two concurrent redemptions yield exactly one success. If
 * anything after the claim throws, the claim rolls back with it: burning a code
 * for a phone that never got its token would strand the shopkeeper.
 */
export type ActivateErrorCode = keyof typeof ERROR_CATALOG;

/** Thrown inside the transaction to abort it with a contract error. */
export class Refusal extends Error {
  constructor(readonly code: ActivateErrorCode) {
    super(code);
    this.name = 'Refusal';
  }
}

async function claim(tx: Tx, code: string, email: string, deviceId: string): Promise<string> {
  const [row] = await tx.execute<{ outcome: string; business_id: string | null }>(
    sql`SELECT outcome, business_id FROM xangarro.redeem_activation_code(${code}, ${email}, ${deviceId})`,
  );
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
): Promise<void> {
  await tx.insert(devices).values({
    id: deviceId,
    nombre: device.name,
    plataforma: device.platform,
    modelo: device.osVersion,
    businessId,
    createdAt: now,
    updatedAt: now,
  });
}

export async function activate(input: ActivateRequest): Promise<ActivateResponse> {
  const deviceId = newUlid();
  const now = new Date();

  return db().transaction(async (tx) => {
    const businessId = await claim(tx, input.code, input.email, deviceId);
    // Only now is there a tenant. Scope the rest by it, exactly as a request is.
    await tx.execute(sql`SELECT set_config('xangarro.business_id', ${businessId}, true)`);
    const entitlement = await entitlementFor(tx as Tx, businessId, now);
    await assertSlotFree(tx, businessId, entitlement.limits.devices);
    await registerDevice(tx, deviceId, businessId, input.device, now.toISOString());
    // The committed counter, read BEFORE the tables: a write landing between
    // the two is then sent twice (harmless) rather than never (DB-SYNC-01).
    // `max(seq)` was the bug — it could sit above a row still in flight.
    const serverSeq = await committedCursor(tx as Tx);

    // Parsed, not cast. The server validates its own response against the
    // contract before sending it, so a future schema drift — a new JSON column,
    // a renamed field — fails here with a precise error instead of shipping a
    // payload the phone rejects. `wireSchema` accepts real bigints for exactly
    // this in-process use.
    return ActivateResponseSchema.parse({
      deviceToken: await mintDeviceToken(businessId, deviceId),
      deviceId,
      businessId,
      entitlement: await signEntitlement(entitlement),
      bootstrap: {
        serverSeq,
        serverTime: now.toISOString(),
        tables: await referenceTables(tx as Tx),
      },
    });
  });
}
