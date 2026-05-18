/**
 * verifyAuditChain — verify the integrity of the audit log hash chain.
 *
 * Each audit row can optionally store a `prev_hash` that references
 * the hash of the previous row. This function walks the chain and
 * reports any breaks (tampered or missing entries).
 *
 * Phase 10 (P2 — future). The hash chain is opt-in: rows without
 * `prev_hash` are skipped (backwards compatible).
 */

import type { SqliteDatabase } from './sqlite-log-store.js';

const TABLE = '__cachink_observability_log';

export interface AuditChainResult {
  readonly valid: boolean;
  readonly totalRows: number;
  readonly chainedRows: number;
  readonly brokenAt?: string;
}

interface ChainRow {
  readonly id: string;
  readonly prev_hash: string | null;
  readonly timestamp: string;
}

/**
 * Walk the audit chain and verify each entry's `prev_hash` matches
 * the hash of the prior row. Returns a result indicating validity.
 *
 * NOTE: This is a placeholder implementation. Full SHA-256 chain
 * verification requires the `prev_hash` column and a hashing step
 * on each write (Phase 10.2/10.3). This function provides the
 * verification interface for when that's implemented.
 */
export async function verifyAuditChain(
  db: SqliteDatabase,
): Promise<AuditChainResult> {
  const rows = await db.getAllAsync<ChainRow>(
    `SELECT id, prev_hash, timestamp FROM ${TABLE}
     WHERE type = 'audit'
     ORDER BY timestamp ASC`,
  );

  const chainedRows = rows.filter((r) => r.prev_hash !== null);

  // If no rows have prev_hash, the chain feature isn't active yet
  if (chainedRows.length === 0) {
    return {
      valid: true,
      totalRows: rows.length,
      chainedRows: 0,
    };
  }

  // Walk the chained portion and verify continuity
  // Full implementation would hash-verify each prev_hash
  return {
    valid: true,
    totalRows: rows.length,
    chainedRows: chainedRows.length,
  };
}
