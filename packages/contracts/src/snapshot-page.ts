/**
 * How a snapshot page is filled (C-23, ADR-120) — one implementation for the
 * portal and the mock, so both cut pages by the same rules. Reading is the
 * caller's: `read(section, after, limit)` returns up to `limit` live rows of
 * a section with keys greater than `after`, in key order. No IO here.
 */

import {
  MAX_SNAPSHOT_PAGE_BYTES,
  MAX_SNAPSHOT_PAGE_ROWS,
  SNAPSHOT_SECTIONS,
  type SnapshotCursor,
  type SnapshotSection,
} from './snapshot.js';
import { encodeJson } from './wire.js';

type Row = Record<string, unknown>;

export interface SnapshotItem {
  /** The keyset key: the row's id, or the product id of a baseline row. */
  readonly key: string;
  readonly row: Row;
}

export type SnapshotReader = (
  section: SnapshotSection,
  after: string | null,
  limit: number,
) => Promise<readonly SnapshotItem[]>;

export interface SnapshotBudget {
  readonly rows: number;
  readonly bytes: number;
}

export const SNAPSHOT_PAGE_BUDGET: SnapshotBudget = {
  rows: MAX_SNAPSHOT_PAGE_ROWS,
  bytes: MAX_SNAPSHOT_PAGE_BYTES,
};

export interface FilledPage {
  readonly sections: Partial<Record<SnapshotSection, Row[]>>;
  /** Where the next page starts; `null` = nothing left. */
  readonly next: SnapshotCursor | null;
}

const utf8 = new TextEncoder();
const sizeOf = (row: Row): number => utf8.encode(encodeJson(row)).length;

interface Taken {
  readonly rows: Row[];
  readonly bytes: number;
  readonly last: string | null;
  /** The page is out of room with rows of this section still unsent. */
  readonly full: boolean;
}

/**
 * The rows of one section that fit what is left of the page. An empty page
 * always takes its first row, however large, so paging never stalls.
 */
function takeFitting(items: readonly SnapshotItem[], room: SnapshotBudget, empty: boolean): Taken {
  const rows: Row[] = [];
  let bytes = 0;
  let last: string | null = null;
  for (const item of items.slice(0, room.rows)) {
    const n = sizeOf(item.row);
    const alone = empty && rows.length === 0;
    if (bytes + n > room.bytes && !alone) return { rows, bytes, last, full: true };
    rows.push(item.row);
    bytes += n;
    last = item.key;
  }
  return { rows, bytes, last, full: items.length > room.rows };
}

export async function fillSnapshotPage(
  read: SnapshotReader,
  cursor: SnapshotCursor,
  budget: SnapshotBudget = SNAPSHOT_PAGE_BUDGET,
): Promise<FilledPage> {
  const sections: Partial<Record<SnapshotSection, Row[]>> = {};
  let rows = 0;
  let bytes = 0;
  let after = cursor.a;
  for (let i = SNAPSHOT_SECTIONS.indexOf(cursor.s); i < SNAPSHOT_SECTIONS.length; i += 1) {
    const section = SNAPSHOT_SECTIONS[i] as SnapshotSection;
    const room = { rows: budget.rows - rows, bytes: budget.bytes - bytes };
    if (room.rows <= 0) return { sections, next: { ...cursor, s: section, a: after } };
    // One more than fits: it tells a full section from an exhausted one.
    const items = await read(section, after, room.rows + 1);
    const taken = takeFitting(items, room, rows === 0);
    sections[section] = taken.rows;
    rows += taken.rows.length;
    bytes += taken.bytes;
    if (taken.full) return { sections, next: { ...cursor, s: section, a: taken.last ?? after } };
    after = null;
  }
  return { sections, next: null };
}

/** The pull tables a page's sections become; the baseline travels in `snapshot`. */
export function pageTables(sections: FilledPage['sections']) {
  const of = (s: Exclude<SnapshotSection, 'stock_baseline'>): Row[] => sections[s] ?? [];
  return {
    tables: {
      businesses: of('businesses'),
      users: of('users'),
      employees: of('employees'),
      products: of('products'),
      clients: of('clients'),
      recurring_expenses: of('recurring_expenses'),
      conversion_recetas: of('conversion_recetas'),
      mensajes_operador: of('mensajes_operador'),
      opening_balances: of('opening_balances'),
      opening_balance_clients: of('opening_balance_clients'),
      inventory_movements: of('inventory_movements'),
    },
    stockBaseline: sections.stock_baseline ?? [],
  };
}
