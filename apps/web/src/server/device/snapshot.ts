import 'server-only';

import {
  decodeSnapshotToken,
  encodeSnapshotToken,
  fillSnapshotPage,
  pageTables,
  snapshotStart,
  SNAPSHOT_START,
  type SnapshotInfo,
} from '@xangarro/contracts';
import { committedCursor } from '@xangarro/data-pg';

import type { Tx } from '../db';
import { tenantFeatureFlags } from './bootstrap';
import { snapshotReader } from './snapshot-reads';

/**
 * One page of a snapshot bootstrap (C-23, ADR-119; contract §3, §5), inside
 * the caller's tenant transaction.
 *
 * `start` reads the committed cursor **first**, as the legacy bootstrap did
 * (DB-SYNC-01): everything at or below it is in the snapshot, everything
 * after it reaches the device by the ordinary pull from it. Later pages carry
 * that cursor in their token. Each page is at most 5,000 rows and 2 MB of row
 * JSON (`fillSnapshotPage`), whatever the tenant's size.
 */
export interface SnapshotPage {
  readonly serverSeq: number;
  readonly tables: ReturnType<typeof pageTables>['tables'] & {
    readonly feature_flags: Record<string, boolean>;
  };
  readonly snapshot: SnapshotInfo;
}

/** The page `token` names (`start`, or a `next` a page handed out); `null` for any other. */
export async function snapshotPage(tx: Tx, token: string, now: Date): Promise<SnapshotPage | null> {
  const first = token === SNAPSHOT_START;
  const cursor = first ? snapshotStart(await committedCursor(tx), now) : decodeSnapshotToken(token);
  if (cursor === null) return null;
  const page = await fillSnapshotPage(snapshotReader(tx, cursor), cursor);
  const { tables, stockBaseline } = pageTables(page.sections);
  return {
    serverSeq: cursor.c,
    tables: { ...tables, feature_flags: await tenantFeatureFlags(tx) },
    snapshot: {
      cutoff: cursor.cutoff,
      first,
      next: page.next === null ? null : encodeSnapshotToken(page.next),
      stockBaseline: stockBaseline as SnapshotInfo['stockBaseline'],
    },
  };
}

/**
 * A first page with nothing in it but the way to the real one (`next` is
 * `start`): what activation hands over when reading the first page failed
 * after the code was spent. The device pulls the snapshot from scratch.
 */
export function emptyFirstPage(now: Date) {
  const { cutoff } = snapshotStart(0, now);
  return {
    serverSeq: 0,
    serverTime: now.toISOString(),
    tables: { ...pageTables({}).tables, feature_flags: {} },
    snapshot: { cutoff, first: true, next: SNAPSHOT_START, stockBaseline: [] },
  };
}
