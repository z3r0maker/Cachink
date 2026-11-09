/**
 * C-12's informational `usage` block, as the mock computes it from the rows
 * it holds: the tickets dated in the month of `now` and the active products.
 * Unsigned and advisory — it rides beside the entitlement so the phone can
 * show how far over a limit the business is; it never gates a push.
 */

import type { UsageBlock } from '../sync-pull.js';
import type { MockState } from './state.js';

const live = (row: Record<string, unknown>): boolean => row['deletedAt'] === null;

export function usageOf(state: MockState, now: Date): UsageBlock {
  const period = now.toISOString().slice(0, 7);
  const transactions = state
    .rowsOf('tickets')
    .filter(
      (r) => live(r.row) && String(r.row['fecha'] ?? r.row['createdAt']).startsWith(period),
    ).length;
  const products = state
    .rowsOf('products')
    .filter((r) => live(r.row) && r.row['active'] !== false).length;
  return { period, transactions, products, computedAt: now.toISOString() };
}
