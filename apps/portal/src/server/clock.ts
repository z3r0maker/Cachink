import 'server-only';

import { hoyEn, parseIsoDate, type IsoDate } from '@xangarro/domain';

/**
 * The business's "today" for every screen (P-09, P-13, P-14): the date in
 * Mexico City, not UTC's. `PORTAL_TODAY` pins it — the E2E suite sets it to
 * the seed's day so the demo tenant's May rows stay in the current period; it
 * is never set in production.
 */
export function hoy(): IsoDate {
  const pinned = process.env.PORTAL_TODAY;
  return pinned !== undefined && pinned !== '' ? parseIsoDate(pinned) : hoyEn();
}
