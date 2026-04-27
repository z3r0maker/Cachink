/**
 * `useLanHandle` — shell-agnostic hook that lazily initialises the
 * `LanSyncHandle` once the user is paired (Slice 9.5 T05).
 *
 * Before this existed, both app shells declared `useLanHandle` as
 * absent → `AppProviders` fell back to `NULL_HANDLE_HOOK` →
 * `<LanSyncProvider handle={null}>` kept every consumer in the inert
 * idle state. The LAN backend (`@cachink/sync-lan/createLanSyncClient`)
 * existed and was tested, but no caller ever instantiated it.
 *
 * Contract:
 *   - Runs inside `<AppProviders>` so `useDatabase` + `useDeviceId`
 *     are in scope.
 *   - Reads mode + serverUrl + accessToken from the AppConfig store
 *     and `__cachink_sync_state`; gates creation on all three being
 *     present.
 *   - **Skips creation when `lanRole === 'host'`** — the host runs the
 *     LAN server (a Rust process inside Tauri) and writing the same
 *     SQLite file directly. Instantiating a sync client on the host
 *     would have it push/pull against itself, looping or thrashing
 *     auth. Only LAN clients (mobile tablets, secondary desktops)
 *     instantiate the client.
 *   - Calls `initLanSyncIfMode('lan', {...})` exactly once per
 *     distinct (deviceId, serverUrl, accessToken) triple. Disposes on
 *     unmount or when the inputs change.
 *
 * Both mobile and desktop shells import this hook directly — the
 * platform-specific piece is only the Tauri LAN *server*, not the
 * client. Shared wiring lives here.
 */

import { useEffect, useState } from 'react';
import { useDatabase } from '../database/_internal';
import { useDeviceId, useMode } from '../app-config/index';
import { useLanAuthToken } from '../hooks/use-lan-auth';
import { initLanSyncIfMode, type LanSyncHandle } from './lan-bridge';

function useServerUrl(db: ReturnType<typeof useDatabase>, refreshKey: unknown): string | null {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const { readSyncState } = await import('@cachink/data');
        const raw = await readSyncState(db, 'auth.serverUrl');
        if (!cancelled) setServerUrl(typeof raw === 'string' ? raw : null);
      } catch {
        if (!cancelled) setServerUrl(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [db, refreshKey]);
  return serverUrl;
}

interface InitArgs {
  readonly db: ReturnType<typeof useDatabase>;
  readonly deviceId: string;
  readonly serverUrl: string;
  readonly accessToken: string;
}

function useStartLanSync(ready: boolean, args: InitArgs | null): LanSyncHandle | null {
  const [handle, setHandle] = useState<LanSyncHandle | null>(null);
  useEffect(() => {
    if (!ready || !args) return;
    let disposed = false;
    let local: LanSyncHandle | null = null;
    void initLanSyncIfMode('lan', args)
      .then((h) => {
        if (disposed) {
          void h?.dispose();
          return;
        }
        local = h;
        setHandle(h);
      })
      .catch((err: unknown) => {
        console.error('[useLanHandle] initLanSync failed', err);
      });
    return () => {
      disposed = true;
      if (local) {
        void local.dispose();
        setHandle(null);
      }
    };
  }, [ready, args?.db, args?.deviceId, args?.serverUrl, args?.accessToken]);
  return handle;
}

export function useLanHandle(): LanSyncHandle | null {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const mode = useMode();
  const { token } = useLanAuthToken();
  const serverUrl = useServerUrl(db, token);
  // Hosts run the Rust LAN server (Tauri) and own the SQLite file
  // directly — instantiating a sync client on the host would push/pull
  // against its own server, looping or thrashing auth. Per ADR-039 the
  // host/client distinction lives in AppMode itself: only `'lan-client'`
  // gets a sync handle.
  const ready = mode === 'lan-client' && !!deviceId && !!token && !!serverUrl;
  const args: InitArgs | null = ready
    ? {
        db,
        deviceId: deviceId as string,
        serverUrl: serverUrl as string,
        accessToken: token as string,
      }
    : null;
  return useStartLanSync(ready, args);
}
