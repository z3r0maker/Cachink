import 'server-only';

import { isPlausibleToken } from '@xangarro/auth-core';
import { openSession, resolveSession, revokeSession } from '@xangarro/data-pg';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { db } from './db';

/**
 * The portal session: who is looking, and at which business.
 *
 * **Server-side** (audit SEC-AUTH-01). The cookie used to be a signed copy of
 * the claims, so it never expired, logout could not invalidate a copy, and a
 * removed or demoted member kept their role until the cookie aged out. Now the
 * cookie is 256 random bits and every request looks it up: logout, expiry,
 * idleness and a membership change end or change it at once
 * (`xangarro.session_resolve` reads the role as it is **now**).
 *
 * The claims keep **the shape Supabase's access token carries** — `sub`,
 * `role`, `business_id` — so `withTenant` can still put them straight into
 * `request.jwt.claims`, and adopting GoTrue later replaces the issuer only.
 */
export interface SessionClaims {
  /** `auth.users.id`. */
  readonly sub: string;
  readonly email: string;
  /** Always `authenticated` — the shape PostgREST expects. */
  readonly role: 'authenticated';
  readonly business_id: string;
  /** The member's role on that business, from `business_members`, as of this request. */
  readonly member_role: 'owner' | 'admin' | 'viewer';
}

export const SESSION_COOKIE = 'xg_session';
/** A session ends 30 days after sign-in, whatever happens. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
/** …or after 7 days unseen. */
export const SESSION_IDLE_SECONDS = 60 * 60 * 24 * 7;

/** One lookup per request, however many components ask. */
export const readSession = cache(async (): Promise<SessionClaims | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // A cookie that cannot be one of ours never costs a database round trip.
  if (token === undefined || !isPlausibleToken(token)) return null;
  const s = await resolveSession(db(), token, SESSION_IDLE_SECONDS);
  if (s === null) return null;
  return {
    sub: s.userId,
    email: s.email,
    role: 'authenticated',
    business_id: s.businessId,
    member_role: s.role,
  };
});

export async function startSession(userId: string, businessId: string): Promise<void> {
  const token = await openSession(db(), userId, businessId, SESSION_TTL_SECONDS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token !== undefined && token !== '') await revokeSession(db(), token);
  jar.delete(SESSION_COOKIE);
}
