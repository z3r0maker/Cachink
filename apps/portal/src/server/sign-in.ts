import 'server-only';

import { sql } from 'drizzle-orm';

import type { Role } from '@/session/types';

import { db } from './db';
import { startSession } from './session';

/**
 * Open a portal session for an account whose credential was already checked —
 * a password, a sign-in link, or a reset link. False when the account belongs
 * to no business yet.
 *
 * Not a server action on purpose: exported from a `'use server'` file it would
 * be a public endpoint that signs in any user id.
 *
 * The membership lookup runs outside any tenant transaction: it is the query
 * that decides *which* tenant (see `xangarro.memberships_for_user`).
 */
export async function signInUser(userId: string): Promise<boolean> {
  const [member] = await db().execute<{ business_id: string; role: Role }>(
    sql`SELECT business_id, role FROM xangarro.memberships_for_user(${userId})`,
  );
  if (!member) return false;
  await startSession(userId, member.business_id);
  return true;
}

export const NO_BUSINESS = 'Tu cuenta aún no pertenece a ningún negocio.';
