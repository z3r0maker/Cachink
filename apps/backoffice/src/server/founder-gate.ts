import type { Founder } from '@xangarro/data-corp';

/**
 * The founder permission as plain functions (E-01, ADR-124 §1), so it is
 * unit-tested without a database. `founder.ts` binds them to the corp
 * connection and to Next's redirects.
 *
 * A null lookup means `CORP_DATABASE_URL` is not configured: the console still
 * runs, and «Empresa» simply does not exist for anyone.
 */
export type FounderLookup = (staffId: string) => Promise<Founder | null>;

/** For pages and actions: a failure propagates, so the page shows its error state. */
export async function founderOrNull(
  staffId: string,
  lookup: FounderLookup | null,
): Promise<Founder | null> {
  if (lookup === null) return null;
  return lookup(staffId);
}

/**
 * For the navigation, which every console page renders: a corp outage must
 * not take the platform screens down with it. The area hides and the error is
 * reported instead.
 */
export async function founderForNav(
  staffId: string,
  lookup: FounderLookup | null,
  report: (error: unknown) => void,
): Promise<Founder | null> {
  try {
    return await founderOrNull(staffId, lookup);
  } catch (error) {
    report(error);
    return null;
  }
}
