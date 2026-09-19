/**
 * Adopt the pre-rebrand migrations tracker (ADR-056).
 *
 * Installs migrated before the Cachink → Xangarro rename recorded applied
 * tags in `__cachink_migrations`. The runner must rename that table before
 * it reads tags; otherwise it sees an empty tracker, re-runs 0000 against an
 * existing schema and the app fails to boot.
 *
 * Only renames when the legacy table exists and the new one does not, so a
 * second launch is a no-op and a stale legacy table never overrides the
 * current tracker.
 */

import { sql } from 'drizzle-orm';
import type { XangarroDatabase } from '../repositories/drizzle/_db.js';
import { readStringColumn, type RawRow } from './raw-row.js';

/** Legacy tracker name — kept only to upgrade pre-rebrand installs. */
export const LEGACY_MIGRATIONS_TABLE = '__cachink_migrations';

async function existingTables(
  db: XangarroDatabase,
  names: readonly string[],
): Promise<ReadonlySet<string>> {
  const list = names.map((n) => `'${n}'`).join(', ');
  const rows = (await db.all(
    sql.raw(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${list})`),
  )) as RawRow[];
  const found = new Set<string>();
  for (const row of rows) {
    const name = readStringColumn(row, 'name');
    if (name !== null) found.add(name);
  }
  return found;
}

/** Rename the legacy tracker to `trackerTable` when only the legacy one exists. */
export async function adoptLegacyTracker(
  db: XangarroDatabase,
  trackerTable: string,
): Promise<void> {
  const present = await existingTables(db, [LEGACY_MIGRATIONS_TABLE, trackerTable]);
  if (!present.has(LEGACY_MIGRATIONS_TABLE) || present.has(trackerTable)) return;
  await db.run(sql.raw(`ALTER TABLE ${LEGACY_MIGRATIONS_TABLE} RENAME TO ${trackerTable}`));
}
