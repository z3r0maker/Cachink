import { lookupSession } from '@xangarro/auth-core';

import { IDLE_SECONDS } from './auth/config';
import type { StaffSession } from './auth/ports';
import { db } from './db/client';
import { staffSessionStore } from './db/staff-sessions';
import { decideAccess, type GateDecision } from './gate';

/**
 * Gathers the facts `decideAccess` needs from the console's own session
 * (ADR-080, ADR-160) — who, and whether still allowlisted — and applies it.
 * The one place both the proxy and the server-side guards (`staff.ts`) go
 * through, so they cannot disagree. No `server-only`: the proxy imports it.
 *
 * `lookupSession` never touches the database for a missing or malformed
 * cookie, and the store's resolve re-reads the staff row and the passkey, so
 * a revoked member, or one whose passkey was removed, has no session to present.
 */
export interface GateResolution {
  readonly decision: GateDecision;
  readonly session: StaffSession | null;
}

export async function resolveGate(
  token: string | undefined,
  path: string,
): Promise<GateResolution> {
  const session = await lookupSession(staffSessionStore(db()), token, IDLE_SECONDS);
  const decision = decideAccess({
    path,
    staffId: session?.staffId ?? null,
    isStaff: session !== null,
  });
  return { decision, session };
}
