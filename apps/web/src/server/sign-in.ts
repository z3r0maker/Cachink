import 'server-only';

import { recordGeo } from './geo/record';
import { membershipsOf } from './memberships';
import { startSession } from './session';

/**
 * Open a portal session for an account whose credential was already checked —
 * a password, a sign-in link, or a reset link — on its first business. False
 * when the account belongs to no (unarchived) business.
 *
 * Not a server action on purpose: exported from a `'use server'` file it would
 * be a public endpoint that signs in any user id.
 *
 * The geo counter (N-55) is recorded here rather than in the actions so that
 * the password path and both link paths are covered by one call, and a fourth
 * caller cannot quietly miss it. It counts *successful* sign-ins only: a
 * failed attempt must not record a location for an address that may not belong
 * to whoever is typing. `recordGeo` never throws.
 */
export async function signInUser(userId: string): Promise<boolean> {
  const [first] = await membershipsOf(userId);
  if (first === undefined) return false;
  await startSession(userId, first.businessId);
  await recordGeo('login');
  return true;
}

export const NO_BUSINESS = 'Tu cuenta aún no pertenece a ningún negocio.';
