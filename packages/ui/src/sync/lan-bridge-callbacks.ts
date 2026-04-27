/**
 * `useLanBridgeCallbacks` — shared post-pair / post-host-start persistence
 * shared by both apps' shells (Slice 8 C2/C3, A2-revised in Slice 8 M3).
 *
 * Contract:
 *   - `onPaired(payload)` — client-side callback fired after a successful
 *      `/api/v1/pair` exchange. Writes the access token, server URL, and
 *      business id into `__cachink_sync_state` and AppConfig, then
 *      invalidates the LAN-auth query so `LanGate` flips to `children`.
 *   - `onServerStarted(result)` — host-side callback fired once the
 *      bundled Tauri LAN server reports ready. The host doesn't pair —
 *      it *is* the server — so we stamp the explicit `lanHostReady`
 *      sync-state scope (replaces the pre-revision `'cachink-host'`
 *      sentinel that polluted `auth.accessToken`). `LanGate` then
 *      falls through via `(token || (lanRole === 'host' && hostReady))`.
 *
 * Lives in `@cachink/ui/sync` (not in the apps) because both mobile and
 * desktop need the same persistence logic — only the underlying invoke
 * mechanism differs.
 */

import type { BusinessId } from '@cachink/domain';
import { writeSyncState, type CachinkDatabase } from '@cachink/data';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { APP_CONFIG_KEYS, useSetCurrentBusinessId } from '../app-config/index';
import { useDatabase } from '../database/_internal';
import { useAppConfigRepository } from '../app/repository-provider';
import { syncKeys } from '../hooks/query-keys';
import type { LanPairSuccess } from '../screens/LanPairing/index';
import type { LanHostStartResult } from '../screens/LanPairing/index';

interface PersistPairingArgs {
  readonly db: CachinkDatabase;
  readonly accessToken: string;
  readonly serverUrl: string;
  readonly businessId: string;
}

async function persistPairing({
  db,
  accessToken,
  serverUrl,
  businessId,
}: PersistPairingArgs): Promise<void> {
  await Promise.all([
    writeSyncState(db, 'auth.accessToken', accessToken),
    writeSyncState(db, 'auth.serverUrl', serverUrl),
    writeSyncState(db, 'auth.businessId', businessId),
    writeSyncState(db, 'auth.pairedAt', new Date().toISOString()),
  ]);
}

interface PersistHostReadyArgs {
  readonly db: CachinkDatabase;
  readonly serverUrl: string;
}

/**
 * Host-side persistence: stamp `lanHostReady = true` plus the local
 * server URL. We deliberately leave `auth.accessToken` empty — hosts
 * don't pair, so any code that later reads `accessToken` to send a
 * `Bearer` header would (correctly) skip the host instead of sending
 * a magic-string sentinel that the server defensively rejects.
 */
async function persistHostReady({ db, serverUrl }: PersistHostReadyArgs): Promise<void> {
  await Promise.all([
    writeSyncState(db, 'lanHostReady', true),
    writeSyncState(db, 'auth.serverUrl', serverUrl),
  ]);
}

export interface UseLanBridgeCallbacksResult {
  /** Persist the result of a successful client-side pair. */
  readonly onPaired: (payload: LanPairSuccess) => Promise<void>;
  /** Persist the host's server-start result so the gate falls through. */
  readonly onServerStarted: (result: LanHostStartResult) => Promise<void>;
}

function useSetBusiness(): (businessId: BusinessId) => Promise<void> {
  const appConfig = useAppConfigRepository();
  const setCurrentBusinessId = useSetCurrentBusinessId();
  return useCallback(
    async (businessId: BusinessId): Promise<void> => {
      await appConfig.set(APP_CONFIG_KEYS.currentBusinessId, businessId);
      setCurrentBusinessId(businessId);
    },
    [appConfig, setCurrentBusinessId],
  );
}

function useInvalidateLanAuth(): () => void {
  const queryClient = useQueryClient();
  return useCallback((): void => {
    void queryClient.invalidateQueries({ queryKey: syncKeys.lanAuth() });
  }, [queryClient]);
}

function useInvalidateLanHostReady(): () => void {
  const queryClient = useQueryClient();
  return useCallback((): void => {
    void queryClient.invalidateQueries({ queryKey: syncKeys.lanHostReady() });
  }, [queryClient]);
}

/**
 * Hook returning both LAN-auth persistence callbacks. Consumes:
 *   - the active SQLite handle (for sync-state writes),
 *   - the AppConfig repository (for `currentBusinessId`),
 *   - the React Query client (for cache invalidation).
 */
export function useLanBridgeCallbacks(): UseLanBridgeCallbacksResult {
  const db = useDatabase();
  const setBusiness = useSetBusiness();
  const invalidateAuth = useInvalidateLanAuth();
  const invalidateHostReady = useInvalidateLanHostReady();

  const onPaired = useCallback(
    async (payload: LanPairSuccess): Promise<void> => {
      await persistPairing({
        db,
        accessToken: payload.accessToken,
        serverUrl: payload.serverUrl,
        businessId: payload.businessId,
      });
      await setBusiness(payload.businessId as BusinessId);
      invalidateAuth();
    },
    [db, setBusiness, invalidateAuth],
  );

  const onServerStarted = useCallback(
    async (result: LanHostStartResult): Promise<void> => {
      await persistHostReady({ db, serverUrl: result.url });
      invalidateHostReady();
    },
    [db, invalidateHostReady],
  );

  return { onPaired, onServerStarted };
}

// `useWriteLanRole` was retired in ADR-039. The wizard now writes
// `'lan-server'` / `'lan-client'` directly into AppMode; the legacy
// `__cachink_sync_state.lanRole` scope is no longer set by new code.
// See ARCHITECTURE.md "Deferred Decisions" for the orphaned-row
// cleanup task that lives in Phase 2.
