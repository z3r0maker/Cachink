import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';

/**
 * Old → new data for `0001_users_active.sql` (CLAUDE.md §2.9).
 *
 * Operators that existed before the migration must come out **active** —
 * otherwise adding the column would silently lock every existing operator out
 * of every phone, which is the worst thing a deactivation flag can do.
 *
 * It runs the **real migration file**, not a restatement of it. The app role
 * cannot alter `public.users`, so the old shape is recreated as a temp table:
 * `pg_temp` is searched first, so the migration's `ALTER TABLE "users"` lands on
 * it. What is being tested is the SQL Postgres will actually execute.
 */
const MIGRATION = join(import.meta.dirname, '../drizzle/0001_users_active.sql');
const { url, describe } = integrationSuite();

describe('migration: users.active', () => {
  let sql: postgres.Sql;

  beforeAll(() => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('backfills every existing operator as active, and requires the column after', async () => {
    await sql.begin(async (tx) => {
      // The pre-migration shape: `users` without `active`, holding real rows.
      await tx`CREATE TEMP TABLE users (id text PRIMARY KEY, nombre text NOT NULL) ON COMMIT DROP`;
      await tx`INSERT INTO users (id, nombre) VALUES ('op-1', 'Ana'), ('op-2', 'Luis')`;

      await tx.unsafe(readFileSync(MIGRATION, 'utf8'));

      const rows = await tx<
        { id: string; active: boolean }[]
      >`SELECT id, active FROM users ORDER BY id`;
      assert.deepEqual(
        rows.map((r) => [r.id, r.active]),
        [
          ['op-1', true],
          ['op-2', true],
        ],
        'operators that predate the column must stay able to sign in',
      );

      // And the column is now mandatory: a null would be "neither active nor
      // not", which the authentication check cannot interpret.
      // Inside a savepoint: a failing statement aborts the whole transaction in
      // Postgres, so without one the expected error escapes on commit.
      await assert.rejects(
        () =>
          tx.savepoint(
            (sp) => sp`INSERT INTO users (id, nombre, active) VALUES ('op-3', 'x', NULL)`,
          ),
        /null value/i,
      );
    });
  });
});
