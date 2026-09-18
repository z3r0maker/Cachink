import type { SupabaseClient } from '@supabase/supabase-js';

import { toAal, type Aal } from '../gate';

/*
 * Shared by the proxy and by server code, so it carries no `server-only`
 * import: the proxy is not compiled under the react-server condition.
 */

export interface Identity {
  /** `auth.users.id`. */
  readonly userId: string;
  readonly email: string | null;
  readonly aal: Aal | null;
}

/**
 * Who is signed in, from **verified** JWT claims (`getClaims` checks the
 * signature), never from the unverified session cookie alone.
 */
export async function readIdentity(client: SupabaseClient): Promise<Identity | null> {
  const { data, error } = await client.auth.getClaims();
  if (error || !data) return null;
  const { claims } = data;
  return { userId: claims.sub, email: claims.email ?? null, aal: toAal(claims.aal) };
}
