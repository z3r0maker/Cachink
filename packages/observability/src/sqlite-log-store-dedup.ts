/**
 * Error de-duplication bookkeeping for SqliteLogStore — split out to keep
 * sqlite-log-store.ts under the 200-line cap (CLAUDE.md §2.6).
 */

import type { ErrorLogEntry } from './error-log.js';

export interface DedupEntry {
  count: number;
  firstAt: number;
}

export const DEFAULT_DEDUP_WINDOW_MS = 5_000;

export function buildDedupContext(
  entry: ErrorLogEntry,
  recent: DedupEntry | undefined,
): Record<string, unknown> | undefined {
  if (recent?.count && recent.count > 1) return { ...entry.context, suppressedCount: recent.count };
  return entry.context;
}

export function cleanStaleDedups(
  map: Map<string, DedupEntry>,
  windowMs: number,
  now: number,
): void {
  for (const [key, val] of map) {
    if (now - val.firstAt >= windowMs) map.delete(key);
  }
}
