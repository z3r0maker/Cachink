/**
 * What a migration file must look like before the runner will apply it
 * (DB2-MIG-01, DB3-MIG-01). Pure; unit-tested in
 * `tests/migrate-hosted-statements.test.ts`.
 *
 * A file whose first line is `-- xangarro:no-transaction` runs statement by
 * statement, outside any transaction, so it can build and drop indexes
 * `CONCURRENTLY` — without blocking writes on a table with millions of rows.
 * The price is that a failure half-way leaves the statements before it
 * applied and no ledger row. The runner then re-runs the whole file, so every
 * statement in it must be safe to repeat, and these rules say so:
 *
 * - its first statement is `SET lock_timeout`, so nothing runs under whatever
 *   the session had (R2-11: a late SET used to pass);
 * - every `CREATE INDEX` is `CONCURRENTLY IF NOT EXISTS`, every `DROP INDEX`
 *   is `CONCURRENTLY IF EXISTS`, every `REINDEX` is `CONCURRENTLY`;
 * - it opens no transaction of its own (`BEGIN`, `COMMIT`, `ABORT`, …).
 *
 * The one thing `IF NOT EXISTS` cannot repeat safely — an INVALID index left
 * by a failed concurrent build — the runner drops before the re-run
 * (`ledger.ts`).
 *
 * A transactional file (the default) must not say `CONCURRENTLY` at all —
 * Postgres would refuse it inside the file's transaction — nor `REINDEX`, and
 * sets its timeout with `SET LOCAL` so the value dies with its transaction
 * instead of staying on the runner's session (R2-13).
 *
 * In both, once a file has set `lock_timeout`, a statement that takes ACCESS
 * EXCLUSIVE must run under a short one (`lint-locks.ts`).
 */
import { exclusiveProblem, lockTimeoutMs, readTimeoutSet, setProblem } from './lint-locks';
import { splitStatements, withoutComments } from './statements';

export { lockTimeoutMs } from './lint-locks';

export const NO_TRANSACTION = '-- xangarro:no-transaction';

/** True unless the file's first line is the no-transaction marker. */
export function runsInTransaction(body: string): boolean {
  return body.split('\n', 1)[0]?.trim() !== NO_TRANSACTION;
}

const oneLine = (stmt: string) => withoutComments(stmt).replace(/\s+/g, ' ').trim();

const TX_CONTROL =
  /^(BEGIN|START TRANSACTION|COMMIT|END|ROLLBACK|ABORT|SAVEPOINT|RELEASE|PREPARE TRANSACTION)\b/;
const CREATE_INDEX = /^CREATE (UNIQUE )?INDEX\b/;
const SAFE_CREATE = /^CREATE (UNIQUE )?INDEX CONCURRENTLY IF NOT EXISTS\b/;
const DROP_INDEX = /^DROP INDEX\b/;
const SAFE_DROP = /^DROP INDEX CONCURRENTLY IF EXISTS\b/;
const REINDEX = /^REINDEX\b/;
const SAFE_REINDEX = /^REINDEX (\([^)]*\) )?\w+ CONCURRENTLY\b/;

/** The shape problem of one statement of a no-transaction file. */
function repeatableProblem(s: string): string | null {
  const head = s.slice(0, 60);
  if (TX_CONTROL.test(s)) return `opens or ends a transaction: "${head}"`;
  if (CREATE_INDEX.test(s) && !SAFE_CREATE.test(s))
    return `must be CREATE INDEX CONCURRENTLY IF NOT EXISTS: "${head}"`;
  if (DROP_INDEX.test(s) && !SAFE_DROP.test(s))
    return `must be DROP INDEX CONCURRENTLY IF EXISTS: "${head}"`;
  if (REINDEX.test(s) && !SAFE_REINDEX.test(s)) return `must be REINDEX … CONCURRENTLY: "${head}"`;
  return null;
}

function transactionalProblem(s: string): string | null {
  return REINDEX.test(s)
    ? `REINDEX blocks the table's writes: use REINDEX … CONCURRENTLY in a no-transaction file: "${s.slice(0, 60)}"`
    : null;
}

interface Step {
  readonly problem: string | null;
  /** The `lock_timeout` in force after the statement (null: not known). */
  readonly timeoutMs: number | null;
}

/** One statement, under the `lock_timeout` the file has set so far. */
function step(line: string, transactional: boolean, timeoutMs: number | null): Step {
  const set = readTimeoutSet(line);
  if (set !== null) {
    // SET LOCAL outside a transaction changes nothing.
    const takes = transactional || !set.local;
    return {
      problem: setProblem(set, transactional),
      timeoutMs: takes ? lockTimeoutMs(set.value) : timeoutMs,
    };
  }
  const upper = line.toUpperCase();
  const shape = transactional ? transactionalProblem(upper) : repeatableProblem(upper);
  return { problem: shape ?? exclusiveProblem(upper, timeoutMs), timeoutMs };
}

/** Walk the statements in order, tracking the `lock_timeout` in force. */
function statementProblems(statements: readonly string[], transactional: boolean): string[] {
  const out: string[] = [];
  let timeoutMs: number | null = null;
  for (const stmt of statements) {
    const r = step(oneLine(stmt), transactional, timeoutMs);
    if (r.problem !== null) out.push(r.problem);
    timeoutMs = r.timeoutMs;
  }
  return out;
}

/** Why the runner must refuse this file; empty when it is fine. */
export function migrationProblems(body: string): string[] {
  const statements = splitStatements(body);
  if (runsInTransaction(body)) {
    if (/\bCONCURRENTLY\b/i.test(withoutComments(body)))
      return [`uses CONCURRENTLY inside a transaction: start the file with "${NO_TRANSACTION}"`];
    return statementProblems(statements, true);
  }
  const problems = statementProblems(statements, false);
  const first = readTimeoutSet(oneLine(statements[0] ?? ''));
  if (first === null || first.local)
    problems.unshift('must SET lock_timeout as its first statement');
  return problems;
}

/** An index a no-transaction file builds concurrently, where Postgres puts it. */
export interface IndexRef {
  readonly schema: string;
  readonly name: string;
}

const IDENT = String.raw`("[^"]+"|[A-Za-z_][\w$]*)`;
const CONCURRENT_BUILD = new RegExp(
  String.raw`^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\s+(?:IF\s+NOT\s+EXISTS\s+)?${IDENT}` +
    String.raw`\s+ON\s+(?:ONLY\s+)?(?:${IDENT}\s*\.\s*)?${IDENT}`,
  'i',
);
const unquote = (id: string) => (id.startsWith('"') ? id.slice(1, -1) : id.toLowerCase());

/**
 * The indexes a no-transaction file builds concurrently (for the INVALID
 * sweep). An index lives in its table's schema; an unqualified table is taken
 * to be in `public`, the runner's search path (R2-12).
 */
export function concurrentIndexNames(body: string): IndexRef[] {
  return splitStatements(body).flatMap((stmt) => {
    const m = CONCURRENT_BUILD.exec(withoutComments(stmt));
    if (m?.[1] === undefined) return [];
    return [{ schema: m[2] === undefined ? 'public' : unquote(m[2]), name: unquote(m[1]) }];
  });
}
