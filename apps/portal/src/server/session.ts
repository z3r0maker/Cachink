import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * The portal session: who is looking, and at which business.
 *
 * The payload is deliberately **the claim shape Supabase's access token
 * carries** — `sub`, `role`, `business_id`. Two consequences, both wanted:
 *
 *  - `withTenant` can put it straight into `request.jwt.claims`, so the branch
 *    of `xangarro.current_business_id()` that RLS uses in production is the one
 *    the integration suite already proves (`claims.integration.test.ts`).
 *  - Adopting GoTrue later replaces the *issuer* of this payload, not every
 *    query, guard and policy downstream.
 *
 * It is signed, not encrypted: it carries no secret, and the server must be
 * able to detect tampering, not hide the contents. HMAC-SHA256 over the exact
 * bytes that were signed, compared in constant time.
 */
export interface SessionClaims {
  /** `auth.users.id`. */
  readonly sub: string;
  readonly email: string;
  /** Always `authenticated` — the shape PostgREST expects. */
  readonly role: 'authenticated';
  readonly business_id: string;
  /** The member's role on that business, from `business_members`. */
  readonly member_role: 'owner' | 'admin' | 'viewer';
}

export const SESSION_COOKIE = 'xg_session';

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value === undefined || value === '') {
    throw new Error(
      'SESSION_SECRET is not set. Sessions are signed with it; without one the ' +
        'portal cannot tell a real cookie from a forged one.',
    );
  }
  return value;
}

const sign = (payload: string): string =>
  createHmac('sha256', secret()).update(payload).digest('base64url');

export function serializeSession(claims: SessionClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** `null` for anything not signed by this server — never a partial session. */
export function parseSession(token: string | undefined): SessionClaims | null {
  if (token === undefined) return null;
  const [payload, signature] = token.split('.');
  if (payload === undefined || signature === undefined) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  // `timingSafeEqual` throws on a length mismatch, which is itself a leak of
  // sorts; check the length first so both paths cost the same.
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionClaims;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionClaims | null> {
  const jar = await cookies();
  return parseSession(jar.get(SESSION_COOKIE)?.value);
}
