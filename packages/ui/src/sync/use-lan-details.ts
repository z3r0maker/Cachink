/**
 * `useLanDetails` — produces the `lanDetails` prop for `<Settings>`
 * (Slice 9.6 T12, ADR-039).
 *
 * Composes:
 *   - `useMode()` to detect lan-server vs lan-client.
 *   - `useLanSync()` for the live `connectedDevices` count.
 *   - `useLanAuthToken()` for the persisted server URL + paired flag
 *     (via `useServerUrl` below).
 *   - `clearSyncState(db)` for the unpair action — wipes all auth keys
 *     and invalidates the LAN-auth query so `LanGate` flips back to the
 *     pairing screen.
 *
 * Returns `null` outside LAN modes so `<Settings>` simply omits the
 * card. The host-only `onStopHostServer` is plumbed via an optional
 * argument because only the desktop shell knows how to invoke
 * `stopLanServer` (Tauri command). Mobile leaves it undefined.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearSyncState, readSyncState, type CachinkDatabase } from '@cachink/data';
import { useDatabase } from '../database/_internal';
import { useMode } from '../app-config/index';
import { useLanSync } from '../hooks/use-lan-sync';
import { syncKeys } from '../hooks/query-keys';

export interface LanDetails {
  readonly serverUrl: string | null;
  readonly connectedDevices: number;
  readonly isHost: boolean;
  readonly onUnpair: () => void;
  readonly onStopHostServer?: () => void;
}

async function safeReadServerUrl(db: CachinkDatabase): Promise<string | null> {
  try {
    const raw = await readSyncState(db, 'auth.serverUrl');
    return typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

export interface UseLanDetailsArgs {
  /**
   * Desktop shells pass a Tauri-command-backed callback. Mobile omits.
   */
  readonly stopHostServer?: () => Promise<void>;
}

function useServerUrl(isLan: boolean, db: CachinkDatabase, syncStatus: string): string | null {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isLan) {
      setServerUrl(null);
      return;
    }
    let cancelled = false;
    void safeReadServerUrl(db).then((url) => {
      if (!cancelled) setServerUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [db, isLan, syncStatus]);
  return serverUrl;
}

export function useLanDetails(args: UseLanDetailsArgs = {}): LanDetails | null {
  const mode = useMode();
  const db = useDatabase();
  const sync = useLanSync();
  const queryClient = useQueryClient();
  const isLan = mode === 'lan-server' || mode === 'lan-client';
  const serverUrl = useServerUrl(isLan, db, sync.status);

  const onUnpair = useCallback(() => {
    void (async () => {
      await clearSyncState(db);
      void queryClient.invalidateQueries({ queryKey: syncKeys.lanAuth() });
    })();
  }, [db, queryClient]);

  const onStopHostServer = useCallback(() => {
    if (!args.stopHostServer) return;
    void args.stopHostServer().then(() => {
      void queryClient.invalidateQueries({ queryKey: syncKeys.lanHostReady() });
    });
  }, [args, queryClient]);

  if (!isLan) return null;
  return {
    serverUrl,
    connectedDevices: sync.connectedDevices,
    isHost: mode === 'lan-server',
    onUnpair,
    onStopHostServer: args.stopHostServer ? onStopHostServer : undefined,
  };
}
