import 'server-only';

import {
  PullResponseSchema,
  type PullQuery,
  type PullResponse,
  type SnapshotInfo,
} from '@xangarro/contracts';
import { committedCursor, devices } from '@xangarro/data-pg';
import { eq } from 'drizzle-orm';

import { withTenant, type Tx } from '../db';
import type { DeviceCaller } from '../device/authenticate';
import { entitlementFor, legacyBootstrapFits, referenceTables } from '../device/bootstrap';
import { snapshotPage } from '../device/snapshot';
import { usageFor } from '../usage/live.js';
import { signEntitlement } from '../device/credentials';
import { changesSince } from './changes';

/**
 * `GET /sync/pull` (B-09; contract §5).
 *
 * Three reads, one shape. `?snapshot=` is a page of the snapshot bootstrap
 * (C-23, ADR-121). `since=0` without it is the legacy full bootstrap an older
 * device asks for, refused with 426 once the tenant outgrows one body.
 * Anything else is the change stream after `since`.
 *
 * The committed cursor is read **first**. A write that commits between that
 * read and the table reads is then sent now and again next time — harmless —
 * instead of never (audit DB-SYNC-01).
 *
 * The usage block comes from the metering pool, so it is read **alongside**
 * the tenant transaction and awaited after it closes (audit DB2-CONN-01): a
 * slow metering connection must not keep an app connection idle in a
 * transaction, where the 10 s idle-in-transaction limit would kill it. Signing
 * the entitlement is CPU work and happens after the commit too.
 */
export interface PullRefusal {
  readonly refused: {
    readonly code: 'VALIDATION' | 'PROTOCOL_UNSUPPORTED';
    readonly status: number;
  };
  readonly message: string;
}

const UNKNOWN_SNAPSHOT: PullRefusal = {
  refused: { code: 'VALIDATION', status: 400 },
  message: 'snapshot must be `start` or a token a page handed out',
};
const TOO_BIG: PullRefusal = {
  refused: { code: 'PROTOCOL_UNSUPPORTED', status: 426 },
  message: 'Actualiza la app: este negocio ya no cabe en una sola descarga.',
};

/** A page before the contract parses it: rows as Postgres gave them, in the wire shape. */
interface Page {
  readonly serverSeq: number;
  readonly tables: Record<string, unknown>;
  readonly snapshot?: SnapshotInfo;
}

async function readPage(tx: Tx, query: PullQuery, now: Date): Promise<Page | PullRefusal> {
  if (query.snapshot !== undefined) {
    return (await snapshotPage(tx, query.snapshot, now)) ?? UNKNOWN_SNAPSHOT;
  }
  const cursor = await committedCursor(tx);
  if (query.since !== 0) return changesSince(tx, query.since, cursor);
  if (!(await legacyBootstrapFits(tx))) return TOO_BIG;
  return { serverSeq: cursor, tables: await referenceTables(tx) };
}

export async function pull(
  caller: DeviceCaller,
  query: PullQuery,
): Promise<PullResponse | PullRefusal> {
  const now = new Date();
  const usage = usageFor(caller.businessId, now).catch(() => null);
  const read = await withTenant(caller.businessId, async (tx) => {
    // Independent reads: sent together, pipelined.
    const [page, [device], entitlement] = await Promise.all([
      readPage(tx, query, now),
      tx
        .update(devices)
        .set({ lastPullAt: now.toISOString() })
        .where(eq(devices.id, caller.deviceId))
        .returning({ acknowledgedThrough: devices.acknowledgedThrough }),
      entitlementFor(tx, caller.businessId, now),
    ]);
    return { page, device, entitlement };
  });
  if ('refused' in read.page) return read.page;

  const uso = await usage;
  // Parsed, not cast: the server checks its own response against the contract.
  return PullResponseSchema.parse({
    ...(uso === null ? {} : { usage: uso }),
    serverSeq: read.page.serverSeq,
    serverTime: now.toISOString(),
    entitlement: await signEntitlement(read.entitlement),
    tables: read.page.tables,
    acknowledgedThrough: read.device?.acknowledgedThrough ?? 0,
    ...(read.page.snapshot === undefined ? {} : { snapshot: read.page.snapshot }),
  });
}
