/**
 * Which migration files exist, in what order, and which still have to run on
 * the hosted database (B-01). Pure: no database, so the ordering and the drift
 * rules are unit-tested without Docker (`tests/migrate-hosted.test.ts`).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { migrationProblems, runsInTransaction } from './lint';

/**
 * The four migration sets, applied in this order. `local/` is not here: the
 * part of it a hosted project needs is `hosted/` (see its header).
 */
export const MIGRATION_SETS = [
  { set: 'hosted', dir: 'packages/data-pg/hosted' },
  { set: 'data-pg', dir: 'packages/data-pg/drizzle' },
  { set: 'admin', dir: 'apps/backoffice/src/server/db/migrations' },
  { set: 'corp', dir: 'packages/data-corp/drizzle' },
] as const;

export interface MigrationFile {
  /** Ledger key, `<set>/<file>` — unique across the sets. */
  readonly name: string;
  readonly path: string;
  readonly body: string;
  /** SHA-256 (hex) of the file's bytes. */
  readonly checksum: string;
  /** False for a `-- xangarro:no-transaction` file (`lint.ts`). */
  readonly transactional: boolean;
}

export interface AppliedMigration {
  readonly name: string;
  readonly checksum: string;
}

export class MigrationPlanError extends Error {
  constructor(
    readonly code: 'CHECKSUM_MISMATCH' | 'MISSING_FILE' | 'OUT_OF_ORDER' | 'UNSAFE_FILE',
    message: string,
  ) {
    super(message);
    this.name = 'MigrationPlanError';
  }
}

export function checksum(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

/**
 * Every file of every set, in apply order. Within a set the order is plain
 * code-unit order — the same order `db-local.sh`'s glob gives in the C locale,
 * so hosted and local apply byte-identical SQL in the same sequence.
 */
export function listMigrations(root: string): MigrationFile[] {
  return MIGRATION_SETS.flatMap(({ set, dir }) =>
    readdirSync(join(root, dir))
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => {
        const path = join(root, dir, f);
        const body = readFileSync(path, 'utf8');
        return {
          name: `${set}/${f}`,
          path,
          body,
          checksum: checksum(body),
          transactional: runsInTransaction(body),
        };
      }),
  );
}

/**
 * The files still to apply. An applied file whose bytes changed, or that
 * disappeared from the repo, is a hard error: the database no longer matches
 * any state the repository describes, and applying more on top would hide it.
 */
export function pendingMigrations(
  files: readonly MigrationFile[],
  applied: readonly AppliedMigration[],
): MigrationFile[] {
  const byName = new Map(files.map((f) => [f.name, f]));
  for (const row of applied) {
    const file = byName.get(row.name);
    if (file === undefined) {
      throw new MigrationPlanError(
        'MISSING_FILE',
        `${row.name} is applied on the database but no longer in the repository.`,
      );
    }
    if (file.checksum !== row.checksum) {
      throw new MigrationPlanError(
        'CHECKSUM_MISMATCH',
        `${row.name} changed after it was applied (ledger ${row.checksum.slice(0, 12)}…, ` +
          `file ${file.checksum.slice(0, 12)}…). Never edit an applied migration; add a new one.`,
      );
    }
  }
  const done = new Set(applied.map((a) => a.name));
  const pending = files.filter((f) => !done.has(f.name));
  refuseOutOfOrder(pending, applied);
  refuseUnsafe(pending);
  return pending;
}

const setOf = (name: string) => name.slice(0, name.indexOf('/'));

/**
 * A pending file that sorts below one already applied in its set would run
 * in one order here and in file order on a fresh database — the audit found
 * two (DB2-MIG-01). Renumber it above the last applied file instead.
 */
function refuseOutOfOrder(
  pending: readonly MigrationFile[],
  applied: readonly AppliedMigration[],
): void {
  const last = new Map<string, string>();
  for (const { name } of applied) {
    const seen = last.get(setOf(name));
    if (seen === undefined || name > seen) last.set(setOf(name), name);
  }
  for (const file of pending) {
    const seen = last.get(setOf(file.name));
    if (seen !== undefined && file.name < seen) {
      throw new MigrationPlanError(
        'OUT_OF_ORDER',
        `${file.name} sorts before ${seen}, which is already applied: a fresh database ` +
          `would apply them in the other order. Renumber it above ${seen}.`,
      );
    }
  }
}

/** Refuse to start when any pending file breaks `lint.ts`'s rules. */
function refuseUnsafe(pending: readonly MigrationFile[]): void {
  const bad = pending.flatMap((f) => migrationProblems(f.body).map((p) => `${f.name} ${p}`));
  if (bad.length > 0) throw new MigrationPlanError('UNSAFE_FILE', bad.join('; '));
}
