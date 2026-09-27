/**
 * The lock-wait half of the migration lint (DB3-MIG-01; ADR-109 amendment).
 * Pure; unit-tested in `tests/migrate-hosted-statements.test.ts`.
 *
 * Two kinds of statement wait for locks very differently:
 *
 * - `CREATE/DROP INDEX CONCURRENTLY`, `REINDEX … CONCURRENTLY` and
 *   `ALTER TABLE … SET (storage options)` take SHARE UPDATE EXCLUSIVE at most.
 *   While they wait — a concurrent build waits for every transaction holding
 *   an older snapshot, anywhere in the database — no reader or writer queues
 *   behind them. A long or zero `lock_timeout` harms nobody, and a short one
 *   fails the build and leaves an INVALID index behind (the audit reproduced
 *   it with a 3 s timeout and one slow report).
 * - Everything that takes ACCESS EXCLUSIVE (or SHARE ROW EXCLUSIVE, for a
 *   trigger) makes every later reader and writer of its table queue behind it
 *   for as long as it waits. Those must wait only a moment; the runner retries
 *   them with backoff (`retry.ts`).
 */

/** The longest an ACCESS EXCLUSIVE statement may wait for its lock. */
export const MAX_EXCLUSIVE_WAIT_MS = 500;

const UNIT_MS: Record<string, number> = {
  us: 0.001,
  ms: 1,
  s: 1000,
  min: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * A `lock_timeout` setting in milliseconds (0 = wait forever), as Postgres
 * reads it: a bare number is milliseconds. Null when it is not a literal
 * (`DEFAULT`) or not a duration.
 */
export function lockTimeoutMs(value: string): number | null {
  const m = /^'?\s*(\d+(?:\.\d+)?)\s*(us|ms|s|min|h|d)?\s*'?$/i.exec(value.trim());
  if (m === null) return null;
  return Number(m[1]) * (UNIT_MS[(m[2] ?? 'ms').toLowerCase()] ?? 1);
}

export interface TimeoutSet {
  readonly local: boolean;
  readonly value: string;
}

/** `SET [LOCAL|SESSION] lock_timeout = | TO …`, or null for any other statement. */
export function readTimeoutSet(stmt: string): TimeoutSet | null {
  const m = /^SET\s+(LOCAL\s+|SESSION\s+)?lock_timeout\s*(?:=|\s+TO\s+)\s*(.+)$/i.exec(stmt);
  if (m === null) return null;
  return { local: /^LOCAL/i.test(m[1] ?? ''), value: m[2] ?? '' };
}

/** Is this `SET` wrong for its kind of file? */
export function setProblem(set: TimeoutSet, transactional: boolean): string | null {
  if (lockTimeoutMs(set.value) === null) return `cannot read the lock_timeout value ${set.value}`;
  if (transactional && !set.local)
    return 'sets lock_timeout for the whole session: use SET LOCAL in a transactional file';
  if (!transactional && set.local)
    return 'SET LOCAL lock_timeout does nothing outside a transaction: use SET';
  return null;
}

const EXCLUSIVE =
  /^(ALTER (TABLE|POLICY|INDEX|VIEW|MATERIALIZED VIEW|SEQUENCE|TYPE|DOMAIN)|DROP (TABLE|INDEX|POLICY|TRIGGER|VIEW|MATERIALIZED VIEW|RULE|SEQUENCE|TYPE)|LOCK|TRUNCATE|CLUSTER|VACUUM FULL|CREATE (OR REPLACE )?(CONSTRAINT )?(TRIGGER|RULE)|CREATE POLICY)\b/;
const WEAK =
  /^(DROP INDEX CONCURRENTLY|ALTER TABLE (IF EXISTS )?(ONLY )?\S+ (SET|RESET) \([^()]*\)$)/;

const describeWait = (ms: number) => (ms === 0 ? 'forever' : `${ms} ms`);

/**
 * `upper` (a flattened, upper-cased statement) blocks its table's traffic
 * while it waits, and `timeoutMs` — the file's current setting, null while
 * unknown — lets it wait too long.
 */
export function exclusiveProblem(upper: string, timeoutMs: number | null): string | null {
  if (timeoutMs === null || !EXCLUSIVE.test(upper) || WEAK.test(upper)) return null;
  if (timeoutMs > 0 && timeoutMs <= MAX_EXCLUSIVE_WAIT_MS) return null;
  return (
    `takes ACCESS EXCLUSIVE (or blocks writes) and would wait ${describeWait(timeoutMs)}: ` +
    `SET lock_timeout to at most ${MAX_EXCLUSIVE_WAIT_MS} ms before it — the runner retries — "${upper.slice(0, 60)}"`
  );
}
