/**
 * Cloud auth barrel + `cloudAuth()` factory.
 *
 * The factory reads from `__cachink_sync_state` first (BYO Avanzado
 * override), then falls back to baked-in env vars via the second
 * argument. Returns `null` when neither source is populated — UI code
 * uses that signal to disable the Cloud wizard card.
 */

export * from './cloud-auth.js';
export * from './supabase-auth.js';

import { SupabaseAuthConnector } from './supabase-auth.js';
import type { CloudAuth, CloudAuthConfig } from './cloud-auth.js';

export interface CloudAuthFactoryDeps {
  /** Optional BYO override persisted in `__cachink_sync_state`. */
  readonly byo: CloudAuthConfig | null;
  /** Baked-in env-driven defaults (null when the build wasn't configured). */
  readonly defaults: CloudAuthConfig | null;
}

export function cloudAuth(deps: CloudAuthFactoryDeps): CloudAuth | null {
  const config = deps.byo ?? deps.defaults;
  if (!config) return null;
  return new SupabaseAuthConnector(config);
}
