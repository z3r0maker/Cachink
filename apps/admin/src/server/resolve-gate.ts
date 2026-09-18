import type { SupabaseClient } from '@supabase/supabase-js';

import { db } from './db/client';
import { findActiveStaff, type ActiveStaff } from './db/staff';
import { decideAccess, type GateDecision } from './gate';
import { readIdentity, type Identity } from './supabase/identity';

/**
 * Gathers the three facts `decideAccess` needs — verified identity, allowlist
 * row, AAL — and applies it. The one place both the proxy and the server-side
 * guards (`staff.ts`) go through, so they cannot disagree. No `server-only`:
 * the proxy imports it.
 */
export interface GateResolution {
  readonly decision: GateDecision;
  readonly identity: Identity | null;
  readonly staff: ActiveStaff | null;
}

export async function resolveGate(client: SupabaseClient, path: string): Promise<GateResolution> {
  const identity = await readIdentity(client);
  const staff = identity ? await findActiveStaff(db(), identity.userId) : null;
  const decision = decideAccess({
    path,
    userId: identity?.userId ?? null,
    isStaff: staff !== null,
    aal: identity?.aal ?? null,
  });
  return { decision, identity, staff };
}
