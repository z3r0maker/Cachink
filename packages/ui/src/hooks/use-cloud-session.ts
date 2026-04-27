/**
 * `useCloudSession` — thin wrapper around a `CloudAuthHandle` that
 * exposes the current session snapshot to React components (P1E-M3 C12).
 *
 * The actual handle lifecycle is managed by the app-shell route (which
 * calls `initCloudAuth` lazily once the app selects Cloud mode). This
 * hook just subscribes to state changes and returns the derived
 * snapshot for consumers like `SyncStatusBadge` and `GatedNavigation`.
 */

import { useEffect, useMemo, useState } from 'react';
import type { CloudAuthHandle, CloudCredentials } from '../sync/cloud-bridge';

export interface CloudSessionState {
  readonly credentials: CloudCredentials | null;
  readonly signedIn: boolean;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export interface UseCloudSessionResult extends CloudSessionState {
  readonly signOut: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}

const INITIAL: CloudSessionState = {
  credentials: null,
  signedIn: false,
  isLoading: true,
  error: null,
};

function readyState(creds: CloudCredentials | null, error: Error | null = null): CloudSessionState {
  return {
    credentials: creds,
    signedIn: creds !== null,
    isLoading: false,
    error,
  };
}

function useSessionEffect(
  handle: CloudAuthHandle | null,
  setState: React.Dispatch<React.SetStateAction<CloudSessionState>>,
): void {
  useEffect(() => {
    if (!handle) {
      setState({ ...INITIAL, isLoading: false });
      return;
    }
    let cancelled = false;
    const loadOnce = async (): Promise<void> => {
      try {
        const creds = await handle.getSession();
        if (!cancelled) setState(readyState(creds));
      } catch (err) {
        if (!cancelled)
          setState(readyState(null, err instanceof Error ? err : new Error(String(err))));
      }
    };
    void loadOnce();
    const unsubscribe = handle.onAuthStateChange((creds) => setState(readyState(creds)));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [handle, setState]);
}

export function useCloudSession(handle: CloudAuthHandle | null): UseCloudSessionResult {
  const [state, setState] = useState<CloudSessionState>(INITIAL);
  useSessionEffect(handle, setState);
  const actions = useMemo(
    () => ({
      signOut: async () => {
        if (!handle) return;
        await handle.signOut();
      },
      refresh: async () => {
        if (!handle) return;
        const creds = await handle.getSession();
        setState((s) => ({ ...s, credentials: creds, signedIn: creds !== null }));
      },
    }),
    [handle],
  );
  return { ...state, ...actions };
}
