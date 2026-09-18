import 'server-only';

import { PullResponseSchema, type PullResponse } from '@xangarro/contracts';
import { committedCursor, devices } from '@xangarro/data-pg';
import { eq } from 'drizzle-orm';

import { withTenant } from '../db';
import type { DeviceCaller } from '../device/authenticate';
import { entitlementFor, referenceTables } from '../device/bootstrap';
import { signEntitlement } from '../device/credentials';
import { changesSince } from './changes';

/**
 * `GET /sync/pull` (B-09; contract §5).
 *
 * The committed cursor is read **first**. A write that commits between that
 * read and the table reads is then sent now and again next time — harmless —
 * instead of never (audit DB-SYNC-01). `since=0` is the full bootstrap, the
 * same set activation sends.
 */
export async function pull(caller: DeviceCaller, since: number): Promise<PullResponse> {
  const now = new Date();
  return withTenant(caller.businessId, async (tx) => {
    const cursor = await committedCursor(tx);
    const page =
      since === 0
        ? { serverSeq: cursor, tables: await referenceTables(tx) }
        : await changesSince(tx, since, cursor);

    const [device] = await tx
      .update(devices)
      .set({ lastPullAt: now.toISOString() })
      .where(eq(devices.id, caller.deviceId))
      .returning({ acknowledgedThrough: devices.acknowledgedThrough });

    // Parsed, not cast: the server checks its own response against the contract.
    return PullResponseSchema.parse({
      serverSeq: page.serverSeq,
      serverTime: now.toISOString(),
      entitlement: await signEntitlement(entitlementFor(caller.businessId, now)),
      tables: page.tables,
      acknowledgedThrough: device?.acknowledgedThrough ?? 0,
    });
  });
}
