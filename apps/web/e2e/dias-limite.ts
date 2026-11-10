import { E2E_PORT } from './base-url';

/**
 * The calendar's edge days (J7-22): the portal read on a day other than the
 * seed's 2026-05-12, where the bugs live — a month that starts today, a week
 * and a «last 30 days» that straddle New Year, a February with a 29th.
 *
 * The business's today is `PORTAL_TODAY`, read by `server/clock.ts` on every
 * request, so each edge day is the **same build** served by one more
 * `next start` with that variable changed — no test-only override in the app,
 * and the one clock function stays the only source of the date. A
 * request-level override (a cookie the server honours) would have been one
 * process instead of three, and a back door in the production build.
 *
 * The specs that assume May 2026 never see these servers: each day is its own
 * small project running `fechas-limite.spec.ts` alone, against a tenant the
 * spec mints with rows on exactly the days it asserts. The seed has no
 * February 29 of its own — its fixtures are May 2026 and its ledger is the
 * two months before the day it ran — so the leap day is the spec's rows.
 *
 * The ports sit 1000 above the suite's, out of the range sibling sessions
 * give `E2E_PORT`: locally Playwright adopts whatever already answers on a
 * port, and a stranger's server there would be the wrong clock and database.
 */
export interface DiaLimite {
  /** The Playwright project that runs the spec against this day. */
  readonly project: string;
  /** `PORTAL_TODAY` for this day's server. */
  readonly hoy: string;
  readonly port: number;
}

export const DIAS_LIMITE: readonly DiaLimite[] = [
  // First of a month, first of a year: every look-back crosses into 2026.
  { project: 'dia-anio-nuevo', hoy: '2027-01-01', port: E2E_PORT + 1000 },
  // The leap day itself: the month's last day is the 29th, not the 28th.
  { project: 'dia-bisiesto', hoy: '2028-02-29', port: E2E_PORT + 1001 },
];

/** The edge day a project serves; throws for a project that is not one. */
export function diaDelProyecto(project: string): DiaLimite {
  const dia = DIAS_LIMITE.find((d) => d.project === project);
  if (dia === undefined) throw new Error(`${project} is not a dias-limite project`);
  return dia;
}
