import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import postgres from 'postgres';

import { splitStatements } from '../../scripts/hosted/statements';

/**
 * A throwaway database on the test cluster, migrated up to a chosen file — the
 * "old" half of an old → new migration test (CLAUDE.md §2.9) for migrations
 * that cannot run inside a test transaction (`CREATE INDEX CONCURRENTLY`) or
 * that change shared objects (policies, primary keys) other suites rely on.
 *
 * The roles are cluster-wide and already exist (`local/` created them for
 * the suite's own database), so the chain re-applies cleanly; every file runs
 * as the superuser, exactly as `db-local.sh` does.
 */
const REPO = resolve(import.meta.dirname, '../../../..');
export const DATA_PG_DIR = join(REPO, 'packages/data-pg/drizzle');
export const ADMIN_DIR = join(REPO, 'apps/backoffice/src/server/db/migrations');
const LOCAL_DIR = join(REPO, 'packages/data-pg/local');

export interface ScratchDb {
  readonly url: string;
  readonly sql: postgres.Sql;
  drop(): Promise<void>;
}

const sqlFiles = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

/**
 * Apply one file the way `psql -f` does for `db-local.sh`: statement by
 * statement, each committing on its own. (This also runs the hosted runner's
 * splitter over every migration in the repository.)
 */
export async function applyFile(sql: postgres.Sql, path: string): Promise<void> {
  for (const statement of splitStatements(readFileSync(path, 'utf8'))) await sql.unsafe(statement);
}

export async function createScratchDb(superUrl: string): Promise<ScratchDb> {
  const name = `xg_scratch_${randomBytes(6).toString('hex')}`;
  const admin = postgres(superUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE DATABASE ${name}`);
  const u = new URL(superUrl);
  u.pathname = `/${name}`;
  const sql = postgres(u.toString(), { max: 1, onnotice: () => undefined });
  return {
    url: u.toString(),
    sql,
    async drop() {
      await sql.end({ timeout: 5 }).catch(() => undefined);
      await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end({ timeout: 5 });
    },
  };
}

/**
 * `local/`, then every data-pg file that sorts before `before` (e.g.
 * `'0044'`), then — when `adminBefore` is given — the console's files before
 * it: the order hosted applies them in.
 */
export async function migrateUpTo(
  sql: postgres.Sql,
  before: string,
  adminBefore?: string,
): Promise<void> {
  for (const f of sqlFiles(LOCAL_DIR)) await applyFile(sql, join(LOCAL_DIR, f));
  for (const f of sqlFiles(DATA_PG_DIR).filter((n) => n < before))
    await applyFile(sql, join(DATA_PG_DIR, f));
  if (adminBefore === undefined) return;
  for (const f of sqlFiles(ADMIN_DIR).filter((n) => n < adminBefore))
    await applyFile(sql, join(ADMIN_DIR, f));
}
