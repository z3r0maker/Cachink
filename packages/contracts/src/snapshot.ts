/**
 * The snapshot bootstrap (C-23, ADR-119; docs/plan/02-contracts.md §3, §5).
 *
 * A device that opts in (`bootstrap: 'snapshot'` on `/activate`,
 * `?snapshot=start` on `/sync/pull`) no longer receives every movement the
 * tenant ever wrote. It receives the tenant as of one cursor `C`, in pages:
 *
 *  - the live rows of every reference table;
 *  - the movements created in the last `SNAPSHOT_MOVEMENT_WINDOW_DAYS`;
 *  - one **stock baseline** row per product: the net units of the movements
 *    older than that, which the device keeps in its `__stock_baseline`
 *    (the same table the A-11 retention purge folds into).
 *
 * Stock stays "the sum of the movements" (ADR-081): baseline + rows. Every
 * page is at most `MAX_SNAPSHOT_PAGE_ROWS` rows and `MAX_SNAPSHOT_PAGE_BYTES`
 * of row JSON, so no tenant can outgrow a response body. The last page has
 * `next: null`; the device then pulls `since = C` as always.
 */

import { z } from 'zod';

/** `?snapshot=start` begins a snapshot; any other value is a token a page handed out. */
export const SNAPSHOT_START = 'start' as const;

/** Movements created within this many days travel as rows (ADR-053 §8's local window). */
export const SNAPSHOT_MOVEMENT_WINDOW_DAYS = 90 as const;

/** Rows in one snapshot page, every section together. */
export const MAX_SNAPSHOT_PAGE_ROWS = 5_000 as const;

/**
 * UTF-8 bytes of row JSON in one snapshot page: with the entitlement and the
 * envelope, a whole response stays under 2 MB — under half of Vercel's
 * 4.5 MB body limit.
 */
export const MAX_SNAPSHOT_PAGE_BYTES = 1_900_000 as const;

/**
 * The order a snapshot walks the tenant in: parents before children (the
 * device applies each page in foreign-key order), and what a register needs
 * to open — the business, its operators, its catalogue and stock — first.
 * Recent movements, the bulk, come last.
 */
export const SNAPSHOT_SECTIONS = [
  'businesses',
  'users',
  'employees',
  'products',
  'stock_baseline',
  'clients',
  'recurring_expenses',
  'conversion_recetas',
  'mensajes_operador',
  'opening_balances',
  'opening_balance_clients',
  'inventory_movements',
] as const;
export type SnapshotSection = (typeof SNAPSHOT_SECTIONS)[number];

/** The value a device sends to opt into the snapshot bootstrap on `/activate`. */
export const BootstrapModeSchema = z.literal('snapshot');

/** Net units (entradas − salidas) of one product's movements older than the cutoff. */
export const StockBaselineRowSchema = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().int(),
});
export type StockBaselineRow = z.infer<typeof StockBaselineRowSchema>;

export const SnapshotInfoSchema = z.object({
  /** Movements created before this instant are in the baseline, never sent as rows. */
  cutoff: z.string().datetime(),
  /** The first page of a snapshot: the device resets its baseline before applying it. */
  first: z.boolean(),
  /** Token for the next page (`?snapshot=<next>`); `null` = the snapshot is complete. */
  next: z.string().min(1).max(512).nullable(),
  /** Baseline rows in this page; added to what earlier pages of the snapshot brought. */
  stockBaseline: z.array(StockBaselineRowSchema).default([]),
});
export type SnapshotInfo = z.infer<typeof SnapshotInfoSchema>;

/**
 * Where a snapshot stands: the cursor it is taken at (`c`), its cutoff, the
 * section it is in and the last key sent from it. Opaque to devices, which
 * only echo the token; the server and the mock read it.
 */
export const SnapshotCursorSchema = z.object({
  c: z.number().int().nonnegative(),
  cutoff: z.string().datetime(),
  s: z.enum(SNAPSHOT_SECTIONS),
  a: z.string().min(1).max(128).nullable(),
});
export type SnapshotCursor = z.infer<typeof SnapshotCursorSchema>;

/** base64url of the cursor's JSON — ASCII only, so `btoa` is enough everywhere. */
export function encodeSnapshotToken(cursor: SnapshotCursor): string {
  return btoa(JSON.stringify(cursor)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** The cursor a token carries, or `null` for anything a page never handed out. */
export function decodeSnapshotToken(token: string): SnapshotCursor | null {
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(token)) return null;
  try {
    const json = atob(token.replaceAll('-', '+').replaceAll('_', '/'));
    const parsed = SnapshotCursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The cursor of a snapshot starting now, at committed cursor `c`. */
export function snapshotStart(c: number, now: Date): SnapshotCursor {
  const cutoff = new Date(now.getTime() - SNAPSHOT_MOVEMENT_WINDOW_DAYS * 86_400_000);
  return { c, cutoff: cutoff.toISOString(), s: SNAPSHOT_SECTIONS[0], a: null };
}
