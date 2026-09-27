/**
 * One pulled page, applied atomically (audit DB3-BOOT-01, ADR-120).
 *
 * The rows, a snapshot's baseline and the cursors that record how far the
 * device got commit together or not at all: a page that fails halfway leaves
 * the database and the cursor as they were, so the same page is fetched
 * again. One transaction per page also turns thousands of per-row commits
 * into one.
 */

import { sql } from 'drizzle-orm';
import type { Bootstrap, ReferenceTables, SnapshotInfo } from '@xangarro/contracts';
import { DrizzleAppConfigRepository, type XangarroDatabase } from '@xangarro/data';
import { applyReferenceTables, type ApplyReferenceResult } from './reference-applier.js';
import { addStockBaseline, resetStockBaseline } from './stock-baseline.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

export interface PulledPage {
  readonly serverSeq: number;
  readonly serverTime: string;
  readonly tables: ReferenceTables;
  readonly snapshot?: SnapshotInfo | undefined;
}

/** app_config keys written with the page; `null` removes the key. */
export type CursorWrites = Readonly<Record<string, string | null>>;

/** Where the device pulls from next, and whether a snapshot is still open. */
export function cursorWrites(page: PulledPage): CursorWrites {
  return {
    [SYNC_CONFIG_KEYS.pullSeq]: String(page.serverSeq),
    [SYNC_CONFIG_KEYS.bootstrapNext]: page.snapshot?.next ?? null,
    [SYNC_CONFIG_KEYS.lastServerTime]: page.serverTime,
  };
}

async function writeConfig(db: XangarroDatabase, writes: CursorWrites): Promise<void> {
  const appConfig = new DrizzleAppConfigRepository(db);
  for (const [key, value] of Object.entries(writes)) {
    if (value === null) await appConfig.delete(key);
    else await appConfig.set(key, value);
  }
}

async function pushHwm(db: XangarroDatabase): Promise<number> {
  const raw = await new DrizzleAppConfigRepository(db).get(SYNC_CONFIG_KEYS.pushHwm);
  return Number(raw ?? 0) || 0;
}

async function applyInside(
  db: XangarroDatabase,
  page: PulledPage,
  businessId: string,
  writes: CursorWrites,
): Promise<ApplyReferenceResult> {
  const snapshot = page.snapshot;
  if (snapshot?.first) await resetStockBaseline(db, snapshot.cutoff, await pushHwm(db));
  const result = await applyReferenceTables(db, page.tables, businessId);
  if (snapshot) await addStockBaseline(db, snapshot.stockBaseline);
  await writeConfig(db, writes);
  return result;
}

/** Apply `page` and write `writes`, in one SQLite transaction. */
export async function applyPulledPage(
  db: XangarroDatabase,
  page: PulledPage,
  businessId: string,
  writes: CursorWrites,
): Promise<ApplyReferenceResult> {
  await db.run(sql`BEGIN`);
  try {
    const result = await applyInside(db, page, businessId, writes);
    await db.run(sql`COMMIT`);
    return result;
  } catch (error) {
    await db.run(sql`ROLLBACK`);
    throw error;
  }
}

/** Activation's embedded first page (A-04, O-12), with the cursor it leaves. */
export function applyBootstrap(
  db: XangarroDatabase,
  bootstrap: Bootstrap,
  businessId: string,
): Promise<ApplyReferenceResult> {
  return applyPulledPage(db, bootstrap, businessId, cursorWrites(bootstrap));
}
