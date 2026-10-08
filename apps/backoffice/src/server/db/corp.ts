import { createCorpDb, findFounderByStaffId, type CorpDb } from '@xangarro/data-corp';

import type { FounderLookup } from '../founder-gate';

/**
 * The command center's database handle (ADR-124 §2). `CORP_DATABASE_URL`
 * connects as `xangarro_corp`; the console's platform login (`DATABASE_URL`,
 * `xangarro_admin`) cannot see the corp schema at all.
 *
 * Unset means no «Empresa» area: null, never an error, so environments that
 * have not provisioned the corp roles keep a working console.
 */
let cached: CorpDb | undefined;

export function corpDb(): CorpDb | null {
  const url = process.env.CORP_DATABASE_URL;
  if (url === undefined || url === '') return null;
  cached ??= createCorpDb(url);
  return cached;
}

/** The founder lookup over the corp connection, or null when it is not configured. */
export function founderLookup(): FounderLookup | null {
  const db = corpDb();
  return db === null ? null : (staffId) => findFounderByStaffId(db, staffId);
}
