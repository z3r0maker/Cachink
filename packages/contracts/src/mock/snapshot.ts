/**
 * The mock's snapshot bootstrap (C-23): the same pager as the portal
 * (`fillSnapshotPage`) over `MockState`'s rows. The baseline is the rule the
 * portal applies with `sync_log`: live movements created before the cutoff
 * and stored at or below the snapshot's cursor.
 */

import {
  decodeSnapshotToken,
  encodeSnapshotToken,
  snapshotPagesEstimate,
  snapshotStart,
  SNAPSHOT_SECTIONS,
  SNAPSHOT_START,
  type SnapshotCursor,
  type SnapshotInfo,
  type SnapshotSection,
} from '../snapshot.js';
import {
  fillSnapshotPage,
  pageTables,
  SNAPSHOT_PAGE_BUDGET,
  type SnapshotItem,
} from '../snapshot-page.js';
import type { PullResponse } from '../sync-pull.js';
import type { MockState, StoredRow } from './state.js';
import { MOCK_FEATURE_FLAGS } from './tables.js';

type Row = Record<string, unknown>;

const live = (r: StoredRow): boolean =>
  r.row['deletedAt'] === null || r.row['deletedAt'] === undefined;
const signed = (row: Row): number =>
  row['tipo'] === 'entrada' ? Number(row['cantidad']) : -Number(row['cantidad']);

function withoutEmail(row: Row): Row {
  const { email: _email, ...rest } = row;
  return rest;
}

function baseline(state: MockState, cursor: SnapshotCursor): SnapshotItem[] {
  const sums = new Map<string, number>();
  for (const r of state.rowsOf('inventory_movements')) {
    const old = String(r.row['createdAt']) < cursor.cutoff;
    if (!live(r) || !old || r.serverSeq > cursor.c) continue;
    const p = String(r.row['productoId']);
    sums.set(p, (sums.get(p) ?? 0) + signed(r.row));
  }
  return [...sums]
    .filter(([, n]) => n !== 0)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([productoId, cantidad]) => ({ key: productoId, row: { productoId, cantidad } }));
}

function sectionItems(state: MockState, section: SnapshotSection, cursor: SnapshotCursor) {
  if (section === 'stock_baseline') return baseline(state, cursor);
  return state
    .rowsOf(section)
    .filter(live)
    .filter((r) => section !== 'inventory_movements' || String(r.row['createdAt']) >= cursor.cutoff)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((r) => ({ key: r.id, row: section === 'users' ? withoutEmail(r.row) : r.row }));
}

export interface MockSnapshotPage {
  readonly serverSeq: number;
  readonly tables: PullResponse['tables'];
  readonly snapshot: SnapshotInfo;
}

/** One page for `token` (`start` or a handed-out token); `null` for a token never issued. */
export async function mockSnapshotPage(
  state: MockState,
  token: string,
  now: Date,
): Promise<MockSnapshotPage | null> {
  const first = token === SNAPSHOT_START;
  const cursor = first ? snapshotStart(state.serverSeq, now) : decodeSnapshotToken(token);
  if (cursor === null) return null;
  const read = async (section: SnapshotSection, after: string | null, limit: number) =>
    sectionItems(state, section, cursor)
      .filter((i) => after === null || i.key > after)
      .slice(0, limit);
  const budget = state.snapshotBudget ?? SNAPSHOT_PAGE_BUDGET;
  const page = await fillSnapshotPage(read, cursor, budget);
  const { tables, stockBaseline } = pageTables(page.sections);
  return {
    serverSeq: cursor.c,
    tables: { ...tables, feature_flags: MOCK_FEATURE_FLAGS } as unknown as PullResponse['tables'],
    snapshot: {
      cutoff: cursor.cutoff,
      first,
      next: page.next === null ? null : encodeSnapshotToken(page.next),
      stockBaseline: stockBaseline as SnapshotInfo['stockBaseline'],
      // In memory the count is exact: every section, as the pager will walk it.
      ...(first && {
        pages: snapshotPagesEstimate(
          SNAPSHOT_SECTIONS.reduce((n, s) => n + sectionItems(state, s, cursor).length, 0),
          budget.rows,
        ),
      }),
    },
  };
}
