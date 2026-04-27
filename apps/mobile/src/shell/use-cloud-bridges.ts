/**
 * `useMobileCloudBridges` — mobile shell's `useCloud` factory (Slice
 * 9.6 T06c).
 *
 * Reads the baked-in hosted Cloud defaults from Expo public env vars
 * (`EXPO_PUBLIC_CLOUD_API_URL`, `EXPO_PUBLIC_CLOUD_ANON_KEY`,
 * `EXPO_PUBLIC_POWERSYNC_URL`) and passes them to the shared
 * `useCloudBridges` in `@cachink/ui/sync`. The BYO override stored in
 * `__cachink_sync_state` always takes precedence — the user picks
 * "Avanzado" to point at a different Postgres instance.
 *
 * Per ADR-037, `@supabase/supabase-js` is a direct dependency of
 * `apps/mobile` — lazy-loaded via the sync-cloud bridge. This shell
 * hook does NOT import Supabase directly.
 */

import type { CloudBridges } from '@cachink/ui';
import { useCloudBridges, type UseCloudBridgesArgs } from '@cachink/ui/sync';
import { useCloudNavigation } from './cloud-navigation';

function readMobileDefaults(): UseCloudBridgesArgs['defaults'] {
  const projectUrl = process.env.EXPO_PUBLIC_CLOUD_API_URL;
  const anonKey = process.env.EXPO_PUBLIC_CLOUD_ANON_KEY;
  const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL;
  if (!projectUrl || !anonKey) return null;
  return {
    projectUrl,
    anonKey,
    powersyncUrl: powersyncUrl ?? null,
  };
}

export function useMobileCloudBridges(): CloudBridges | null {
  const nav = useCloudNavigation();
  return useCloudBridges({
    defaults: readMobileDefaults(),
    onOpenAdvanced: nav.openAdvancedBackend,
    onForgotPassword: nav.openPasswordReset,
  });
}
