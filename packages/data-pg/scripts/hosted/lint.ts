/**
 * What a migration file must look like before the runner will apply it
 * (DB2-MIG-01). Pure; unit-tested in `tests/migrate-hosted-lint.test.ts`.
 *
 * A file whose first line is `-- xangarro:no-transaction` runs statement by
 * statement, outside any transaction, so it can build and drop indexes
 * `CONCURRENTLY` — without blocking writes on a table with millions of rows.
 * The price is that a failure half-way leaves the statements before it
 * applied and no ledger row. The runner then re-runs the whole file, so every
 * statement in it must be safe to repeat, and these rules say so:
 *
 * - it sets `lock_timeout`, so a statement queued behind live traffic fails
 *   fast instead of stalling every request behind its lock;
 * - every `CREATE INDEX` is `CONCURRENTLY IF NOT EXISTS`, every `DROP INDEX`
 *   is `CONCURRENTLY IF EXISTS`;
 * - it opens no transaction of its own (`BEGIN`, `COMMIT`, …).
 *
 * The one thing `IF NOT EXISTS` cannot repeat safely — an INVALID index left
 * by a failed concurrent build — the runner drops before the re-run
 * (`ledger.ts`).
 *
 * A transactional file (the default) must not say `CONCURRENTLY` at all:
 * Postgres would refuse it inside the file's transaction.
 */
import { splitStatements, withoutComments } from './statements';

export const NO_TRANSACTION = '-- xangarro:no-transaction';

/** True unless the file's first line is the no-transaction marker. */
export function runsInTransaction(body: string): boolean {
  return body.split('\n', 1)[0]?.trim() !== NO_TRANSACTION;
}

const flat = (stmt: string) => withoutComments(stmt).replace(/\s+/g, ' ').trim().toUpperCase();

const TX_CONTROL = /^(BEGIN|START TRANSACTION|COMMIT|END|ROLLBACK|SAVEPOINT)\b/;
const CREATE_INDEX = /^CREATE (UNIQUE )?INDEX\b/;
const SAFE_CREATE = /^CREATE (UNIQUE )?INDEX CONCURRENTLY IF NOT EXISTS\b/;
const DROP_INDEX = /^DROP INDEX\b/;
const SAFE_DROP = /^DROP INDEX CONCURRENTLY IF EXISTS\b/;

function statementProblem(stmt: string): string | null {
  const s = flat(stmt);
  const head = s.slice(0, 60);
  if (TX_CONTROL.test(s)) return `opens or ends a transaction: "${head}"`;
  if (CREATE_INDEX.test(s) && !SAFE_CREATE.test(s))
    return `must be CREATE INDEX CONCURRENTLY IF NOT EXISTS: "${head}"`;
  if (DROP_INDEX.test(s) && !SAFE_DROP.test(s))
    return `must be DROP INDEX CONCURRENTLY IF EXISTS: "${head}"`;
  return null;
}

/** Why the runner must refuse this file; empty when it is fine. */
export function migrationProblems(body: string): string[] {
  if (runsInTransaction(body)) {
    return /\bCONCURRENTLY\b/i.test(withoutComments(body))
      ? [`uses CONCURRENTLY inside a transaction: start the file with "${NO_TRANSACTION}"`]
      : [];
  }
  const statements = splitStatements(body);
  const problems = statements.map(statementProblem).filter((p): p is string => p !== null);
  if (!statements.some((s) => /^SET LOCK_TIMEOUT\b/.test(flat(s))))
    problems.unshift('runs outside a transaction without SET lock_timeout');
  return problems;
}

/** Index names a no-transaction file builds concurrently (for the INVALID sweep). */
export function concurrentIndexNames(body: string): string[] {
  return splitStatements(body).flatMap((stmt) => {
    const m =
      /^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\s+(?:IF\s+NOT\s+EXISTS\s+)?("[^"]+"|[A-Za-z_][\w$]*)/i.exec(
        withoutComments(stmt),
      );
    const name = m?.[1];
    if (name === undefined) return [];
    return [name.startsWith('"') ? name.slice(1, -1) : name.toLowerCase()];
  });
}
