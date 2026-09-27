import 'server-only';

import { PullResponseSchema, type PullResponse } from '@xangarro/contracts';
import { committedCursor, devices } from '@xangarro/data-pg';
import { eq } from 'drizzle-orm';

import { withTenant } from '../db';
import type { DeviceCaller } from '../device/authenticate';
import { entitlementFor, referenceTables } from '../device/bootstrap';
import { usageFor } from '../usage/live.js';
import { signEntitlement } from '../device/credentials';
import { changesSince } from './changes';

/**
 * `GET /sync/pull` (B-09; contract §5).
 *
 * The committed cursor is read **first**. A write that commits between that
 * read and the table reads is then sent now and again next time — harmless —
 * instead of never (audit DB-SYNC-01). `since=0` is the full bootstrap, the
 * same set activation sends.
 *
 * The usage block comes from the metering pool, so it is read **alongside**
 * the tenant transaction and awaited after it closes (audit DB2-CONN-01): a
 * slow metering connection must not keep an app connection idle in a
 * transaction, where the 10 s idle-in-transaction limit would kill it. Signing
 * the entitlement is CPU work and happens after the commit too.
 */
export async function pull(caller: DeviceCaller, since: number): Promise<PullResponse> {
  const now = new Date();
  const usage = usageFor(caller.businessId, now).catch(() => null);
  const read = await withTenant(caller.businessId, async (tx) => {
    const cursor = await committedCursor(tx);
    // Independent reads, all after the cursor: sent together, pipelined.
    const [page, [device], entitlement] = await Promise.all([
      since === 0
        ? referenceTables(tx).then((tables) => ({ serverSeq: cursor, tables }))
        : changesSince(tx, since, cursor),
      tx
        .update(devices)
        .set({ lastPullAt: now.toISOString() })
        .where(eq(devices.id, caller.deviceId))
        .returning({ acknowledgedThrough: devices.acknowledgedThrough }),
      entitlementFor(tx, caller.businessId, now),
    ]);
    return { page, device, entitlement };
  });

  const uso = await usage;
  // Parsed, not cast: the server checks its own response against the contract.
  return PullResponseSchema.parse({
    ...(uso === null ? {} : { usage: uso }),
    serverSeq: read.page.serverSeq,
    serverTime: now.toISOString(),
    entitlement: await signEntitlement(read.entitlement),
    tables: read.page.tables,
    acknowledgedThrough: read.device?.acknowledgedThrough ?? 0,
  });
}
