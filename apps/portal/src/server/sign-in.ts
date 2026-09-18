import 'server-only';

import { membershipsOf } from './memberships';
import { startSession } from './session';

/**
 * Open a portal session for an account whose credential was already checked —
 * a password, a sign-in link, or a reset link — on its first business. False
 * when the account belongs to no (unarchived) business.
 *
 * Not a server action on purpose: exported from a `'use server'` file it would
 * be a public endpoint that signs in any user id.
 */
export async function signInUser(userId: string): Promise<boolean> {
  const [first] = await membershipsOf(userId);
  if (first === undefined) return false;
  await startSession(userId, first.businessId);
  return true;
}

export const NO_BUSINESS = 'Tu cuenta aún no pertenece a ningún negocio.';
