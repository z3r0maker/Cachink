/**
 * `useDesktopCloudBridges` — desktop shell's `useCloud` factory
 * (Slice 9.6 T06d).
 *
 * Reads the baked-in hosted Cloud defaults from Vite import-meta env
 * vars (`VITE_CLOUD_API_URL`, `VITE_CLOUD_ANON_KEY`, `VITE_POWERSYNC_URL`)
 * and feeds them to the shared `useCloudBridges` hook in
 * `@cachink/ui/sync`. BYO overrides stored in `__cachink_sync_state`
 * (Settings → Avanzado) always take precedence.
 *
 * Supabase + PowerSync are lazy-loaded inside `@cachink/sync-cloud`
 * the moment `initCloudAuth` runs — the desktop shell never imports
 * either package directly.
 */

import type { CloudBridges } from '@cachink/ui';
import { useCloudBridges, type UseCloudBridgesArgs } from '@cachink/ui/sync';
import { useCloudNavigation } from './cloud-navigation';

function readDesktopDefaults(): UseCloudBridgesArgs['defaults'] {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const projectUrl = env.VITE_CLOUD_API_URL;
  const anonKey = env.VITE_CLOUD_ANON_KEY;
  const powersyncUrl = env.VITE_POWERSYNC_URL;
  if (!projectUrl || !anonKey) return null;
  return {
    projectUrl,
    anonKey,
    powersyncUrl: powersyncUrl ?? null,
  };
}

export function useDesktopCloudBridges(): CloudBridges | null {
  const nav = useCloudNavigation();
  return useCloudBridges({
    defaults: readDesktopDefaults(),
    onOpenAdvanced: nav.openAdvancedBackend,
    onForgotPassword: nav.openPasswordReset,
  });
}
