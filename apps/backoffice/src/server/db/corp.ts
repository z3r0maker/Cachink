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

/** For «Empresa» pages and actions, which only render once the founder gate passed. */
export function requireCorpDb(): CorpDb {
  const db = corpDb();
  if (db === null) throw new Error('CORP_DATABASE_URL is not set.');
  return db;
}

/** Today in Mexico City as `YYYY-MM-DD`: the founders' calendar, not the server's. */
export function hoyEnMexico(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

/** The founder lookup over the corp connection, or null when it is not configured. */
export function founderLookup(): FounderLookup | null {
  const db = corpDb();
  return db === null ? null : (staffId) => findFounderByStaffId(db, staffId);
}
