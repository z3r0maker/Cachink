/**
 * The migration ledger on the hosted database (DB-MIG-01): one row per applied
 * file, with the checksum it had. It lives in its own schema so the
 * `ON ALL TABLES IN SCHEMA public` grants of 0001_rls never reach it.
 */
import type { Sql } from 'postgres';

import { concurrentIndexNames, type IndexRef } from './lint';
import type { AppliedMigration, MigrationFile } from './plan';
import { DEFAULT_RETRY, withLockRetry, type RetryPolicy } from './retry';
import { splitStatements } from './statements';

export const LEDGER = 'xangarro_ops.migrations';

export async function ensureLedger(sql: Sql): Promise<void> {
  await sql.unsafe(`
    CREATE SCHEMA IF NOT EXISTS xangarro_ops;
    REVOKE ALL ON SCHEMA xangarro_ops FROM PUBLIC;
    CREATE TABLE IF NOT EXISTS ${LEDGER} (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );`);
}

/** Applied rows; none when the ledger does not exist yet (dry run, first run). */
export async function readApplied(sql: Sql): Promise<AppliedMigration[]> {
  const [reg] = await sql<{ exists: boolean }[]>`
    SELECT to_regclass(${LEDGER}) IS NOT NULL AS exists`;
  if (reg?.exists !== true) return [];
  return sql<AppliedMigration[]>`
    SELECT name, checksum FROM ${sql.unsafe(LEDGER)} ORDER BY applied_at, name`;
}

/**
 * One file, one transaction: its statements and its ledger row commit
 * together or not at all. The runner's default `lock_timeout` is `LOCAL` to
 * that transaction, and so must be any the file sets (`lint.ts`, R2-13).
 * A lock timeout (55P03) rolls the file back and runs it again after a
 * backoff (`retry.ts`), so a file whose ALTERs wait only a moment for their
 * lock still gets through a busy database.
 *
 * A `-- xangarro:no-transaction` file (`lint.ts`) runs statement by statement
 * instead, on one reserved connection, and its ledger row is written only
 * after the last statement succeeds.
 */
export async function applyMigration(
  sql: Sql,
  file: MigrationFile,
  retry: RetryPolicy = DEFAULT_RETRY,
): Promise<void> {
  if (!file.transactional) {
    await applyOutsideTransaction(sql, file, retry);
    return;
  }
  await withLockRetry(
    () =>
      sql.begin(async (tx) => {
        await tx.unsafe(`SET LOCAL lock_timeout = '10s'`);
        if (file.body.trim() !== '') await tx.unsafe(file.body);
        await tx`
          INSERT INTO ${tx.unsafe(LEDGER)} (name, checksum) VALUES (${file.name}, ${file.checksum})`;
      }),
    retry,
  );
}

/**
 * Each statement autocommits, as under `psql -f`. A failure leaves the ones
 * before it applied and no ledger row, so the next run repeats the file:
 * `lint.ts` makes every statement repeatable, and the INVALID index a failed
 * `CREATE INDEX CONCURRENTLY` leaves behind — which `IF NOT EXISTS` would
 * otherwise skip forever — is dropped here first. The sweep runs with no lock
 * timeout: a concurrent drop takes SHARE UPDATE EXCLUSIVE, which blocks
 * nobody, and the file's own first statement sets the timeout for the rest.
 *
 * A statement that fails on its lock timeout is retried alone, after a
 * backoff, on the same session — so under the timeout the file had set.
 */
async function applyOutsideTransaction(
  sql: Sql,
  file: MigrationFile,
  retry: RetryPolicy,
): Promise<void> {
  const conn = await sql.reserve();
  try {
    await conn.unsafe('SET lock_timeout = 0');
    await dropInvalidIndexes(conn, concurrentIndexNames(file.body));
    for (const statement of splitStatements(file.body)) {
      const sweep = () =>
        dropInvalidIndexes(conn, concurrentIndexNames(statement)).then(() => undefined);
      await withLockRetry(() => conn.unsafe(statement), retry, sweep);
    }
    await conn`
      INSERT INTO ${conn.unsafe(LEDGER)} (name, checksum) VALUES (${file.name}, ${file.checksum})`;
  } finally {
    await conn.unsafe('RESET lock_timeout').catch(() => undefined);
    conn.release();
  }
}

/**
 * Drop the INVALID leftovers of an interrupted concurrent build of `indexes`
 * — matched on schema and name, so a same-named index elsewhere is never
 * touched (R2-12).
 */
export async function dropInvalidIndexes(
  sql: Sql,
  indexes: readonly IndexRef[],
): Promise<string[]> {
  if (indexes.length === 0) return [];
  const rows = await sql<{ qualified: string }[]>`
    SELECT format('%I.%I', n.nspname, c.relname) AS qualified
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN unnest(${indexes.map((x) => x.schema)}::text[], ${indexes.map((x) => x.name)}::text[])
        AS want(schema_name, index_name)
        ON want.schema_name = n.nspname AND want.index_name = c.relname
     WHERE NOT i.indisvalid`;
  for (const { qualified } of rows)
    await sql.unsafe(`DROP INDEX CONCURRENTLY IF EXISTS ${qualified}`);
  return rows.map((r) => r.qualified);
}

/**
 * A database that already has the schema but no ledger was migrated by
 * something else (`db-local.sh`, `supabase db push`). Applying 0000 on top
 * would fail half-way; refuse before touching it.
 */
export async function unledgeredSchema(sql: Sql): Promise<boolean> {
  const [row] = await sql<{ found: boolean }[]>`
    SELECT to_regclass('public.businesses') IS NOT NULL
       AND to_regclass(${LEDGER}) IS NULL AS found`;
  return row?.found === true;
}
