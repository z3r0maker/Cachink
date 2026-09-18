/**
 * The migration ledger on the hosted database (DB-MIG-01): one row per applied
 * file, with the checksum it had. It lives in its own schema so the
 * `ON ALL TABLES IN SCHEMA public` grants of 0001_rls never reach it.
 */
import type { Sql } from 'postgres';

import type { AppliedMigration, MigrationFile } from './plan';

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
 * together or not at all. `lock_timeout` makes a migration that would queue
 * behind live traffic fail fast instead of stalling every request behind it.
 */
export async function applyMigration(sql: Sql, file: MigrationFile): Promise<void> {
  await sql.begin(async (tx) => {
    await tx.unsafe(`SET LOCAL lock_timeout = '10s'`);
    if (file.body.trim() !== '') await tx.unsafe(file.body);
    await tx`
      INSERT INTO ${tx.unsafe(LEDGER)} (name, checksum) VALUES (${file.name}, ${file.checksum})`;
  });
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
