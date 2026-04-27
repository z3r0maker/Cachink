/**
 * `useLanAuthToken` + `useLanHostReady` — reactive reads of the LAN
 * pairing material stored in `__cachink_sync_state` (Slice 8 C1,
 * A2-revised in Slice 8 M3, ADR-039).
 *
 * The GatedNavigation LanGate needs three pieces of truth to decide
 * which screen to render:
 *   - Is the device paired (a client)? (`auth.accessToken`)
 *   - Is the device past the host setup? (`lanHostReady`)
 *   - Once paired, which `businessId` did the server assign?
 *     (`auth.businessId`)
 *
 * The pre-ADR-039 `useLanRole` hook is retired; routing flows from
 * AppMode (`'lan-server'` / `'lan-client'`) directly.
 *
 * These hooks wrap `readSyncState` in TanStack Query so state changes
 * trigger re-renders and a post-pair `invalidateQueries` flips the gate.
 * When the `__cachink_sync_state` table doesn't exist yet — e.g. the first
 * boot on a fresh SQLite file before migrations — the helpers treat it as
 * "no value" instead of throwing.
 */

import type { BusinessId } from '@cachink/domain';
import { useQuery } from '@tanstack/react-query';
import { readSyncState, type CachinkDatabase } from '@cachink/data';
import { useDatabase } from '../database/_internal';
import { syncKeys } from './query-keys';

export interface UseLanAuthTokenResult {
  readonly token: string | null;
  readonly businessId: BusinessId | null;
  readonly loading: boolean;
}

export interface UseLanHostReadyResult {
  /** `true` once the host's bundled LAN server has reported ready. */
  readonly ready: boolean;
  readonly loading: boolean;
}

async function safeRead(
  db: CachinkDatabase,
  scope: Parameters<typeof readSyncState>[1],
): Promise<unknown> {
  try {
    return await readSyncState(db, scope);
  } catch {
    // Table missing / migration not yet run — treat as "nothing stored".
    return null;
  }
}

export function useLanAuthToken(): UseLanAuthTokenResult {
  const db = useDatabase();
  const query = useQuery({
    queryKey: syncKeys.lanAuth(),
    queryFn: async () => {
      const [token, businessId] = await Promise.all([
        safeRead(db, 'auth.accessToken'),
        safeRead(db, 'auth.businessId'),
      ]);
      return {
        token: typeof token === 'string' ? token : null,
        businessId: typeof businessId === 'string' ? (businessId as BusinessId) : null,
      };
    },
  });
  return {
    token: query.data?.token ?? null,
    businessId: query.data?.businessId ?? null,
    loading: query.isLoading,
  };
}

/**
 * Reads the host-ready flag stamped by `useLanBridgeCallbacks.onServerStarted`
 * once the bundled Tauri LAN server reports ready. Replaces the
 * prior `'cachink-host'` access-token sentinel so the gate can
 * distinguish "paired client" from "host past setup" without
 * polluting `auth.accessToken`.
 */
export function useLanHostReady(): UseLanHostReadyResult {
  const db = useDatabase();
  const query = useQuery({
    queryKey: syncKeys.lanHostReady(),
    queryFn: async () => {
      const raw = await safeRead(db, 'lanHostReady');
      return raw === true;
    },
  });
  return {
    ready: query.data ?? false,
    loading: query.isLoading,
  };
}
