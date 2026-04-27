/**
 * `useCloudBridges` — shared factory for the `<CloudGate>` `bridges`
 * shape (Slice 9.6 T06c/T06d).
 *
 * Before this existed, both app shells declared `useCloud` as absent
 * → `AppProviders` fell back to `NULL_CLOUD_HOOK` → `<CloudGate>`
 * rendered `null` forever after a user picked Cloud in the wizard.
 * This hook composes the pieces already built in Phase 1E:
 *   - `useByoBackend()` (BYO backend from Avanzado, if any)
 *   - `initCloudAuth(...)` (lazy Supabase auth handle, via sync-cloud)
 *   - `usePersistCloudSession()` (private helper below — persists
 *     session into AppConfig / sync-state once sign-in succeeds)
 *
 * Round 3 F2: `initCloudAuth` is now mode-gated. Local-standalone and
 * LAN users running a Cloud-capable build (env vars baked in) must
 * NOT trigger the dynamic `@cachink/sync-cloud` import on cold start
 * — that violates CLAUDE.md §7's "sync code only loaded when mode
 * needs it" contract. The hook short-circuits to `null` when
 * `useMode()` returns anything other than `'cloud'`.
 *
 * Both app shells call `useMobileCloudBridges` / `useDesktopCloudBridges`
 * (thin wrappers below) that pass in the baked-in hosted defaults
 * sourced from build env vars. The only platform difference is which
 * env-var names are read — Expo uses `EXPO_PUBLIC_CLOUD_*`, Vite uses
 * `VITE_CLOUD_*`.
 */

import { useEffect, useMemo, useState } from 'react';
import type { BusinessId } from '@cachink/domain';
import {
  initCloudAuth,
  type CloudAuthHandle,
  type CloudBackendConfig,
  type CloudCredentials,
} from './cloud-bridge';
import { setCloudHandle } from './cloud-handle-registry';
import type { CloudBridges } from '../app/cloud-gate';
import { useByoBackend } from './use-byo-backend';
import { writeSyncState } from '@cachink/data';
import { useDatabase } from '../database/_internal';
import { APP_CONFIG_KEYS, useMode, useSetCurrentBusinessId } from '../app-config/index';
import type { AppMode } from '../app-config/index';
import { useAppConfigRepository } from '../app/repository-provider';

export interface UseCloudBridgesArgs {
  readonly defaults: CloudBackendConfig | null;
  /** Optional callback routed to Settings → Avanzado. */
  readonly onOpenAdvanced?: () => void;
  /** Optional callback for the "¿Olvidaste tu contraseña?" link. */
  readonly onForgotPassword?: () => void;
}

function usePersistCloudSession(): (creds: CloudCredentials) => Promise<void> {
  const db = useDatabase();
  const appConfig = useAppConfigRepository();
  const setCurrentBusinessId = useSetCurrentBusinessId();
  return async (creds) => {
    await Promise.all([
      writeSyncState(db, 'auth.accessToken', creds.accessToken),
      writeSyncState(db, 'auth.businessId', creds.businessId),
      writeSyncState(db, 'auth.pairedAt', new Date().toISOString()),
    ]);
    await appConfig.set(APP_CONFIG_KEYS.currentBusinessId, creds.businessId);
    setCurrentBusinessId(creds.businessId as BusinessId);
  };
}

/**
 * Lazy-init the cloud auth handle once config is resolved.
 *
 * Distinct from `useCloudAuthHandle` exported by
 * `./cloud-handle-registry` — that one is the public, reactive reader
 * the password-reset overlay subscribes to. This one is the
 * private writer that calls `initCloudAuth` and publishes through
 * `setCloudHandle`.
 *
 * Round 3 F2: short-circuits when `mode !== 'cloud'`. Local /
 * tablet-only / LAN builds with hosted-cloud env vars baked in must
 * NOT trigger the `@cachink/sync-cloud` dynamic import on cold start
 * (CLAUDE.md §7).
 */
function useLazyCloudAuthHandle(
  mode: AppMode | null,
  byo: CloudBackendConfig | null,
  defaults: CloudBackendConfig | null,
  byoLoading: boolean,
): CloudAuthHandle | null {
  const [handle, setHandle] = useState<CloudAuthHandle | null>(null);

  useEffect(() => {
    // Mode-gate: never import @cachink/sync-cloud unless the user
    // actually picked Cloud mode. This is the F2 fix.
    if (mode !== 'cloud') {
      setHandle(null);
      setCloudHandle(null);
      return;
    }
    if (byoLoading) return;
    if (!byo && !defaults) {
      setHandle(null);
      setCloudHandle(null);
      return;
    }
    let cancelled = false;
    void initCloudAuth({ byo, defaults })
      .then((h) => {
        if (cancelled) return;
        setHandle(h);
        // Publish to the module-level registry so
        // `<CloudInnerScreenHost />` (Password reset overlay) can
        // resolve the handle without a sibling provider.
        setCloudHandle(h);
      })
      .catch((err: unknown) => {
        console.error('[useCloudBridges] initCloudAuth failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, byo, defaults, byoLoading]);

  return handle;
}

export function useCloudBridges(args: UseCloudBridgesArgs): CloudBridges | null {
  const mode = useMode();
  const { config: byo, loading: byoLoading } = useByoBackend();
  const handle = useLazyCloudAuthHandle(mode, byo, args.defaults, byoLoading);
  const persist = usePersistCloudSession();

  return useMemo<CloudBridges | null>(() => {
    const backendConfigured = byo !== null || args.defaults !== null;
    if (!backendConfigured && !args.onOpenAdvanced) return null;
    return {
      authHandle: handle,
      backendConfigured,
      onSuccess: persist,
      onOpenAdvanced: args.onOpenAdvanced,
      onForgotPassword: args.onForgotPassword,
      // Magic-link support requires exposing signInWithOtp through
      // CloudAuthHandle — parked for Phase 2. The CloudOnboardingScreen
      // hides the row when this prop is undefined.
      onMagicLink: undefined,
    };
  }, [byo, handle, persist, args.defaults, args.onOpenAdvanced, args.onForgotPassword]);
}
