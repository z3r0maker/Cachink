/**
 * `useLanSync()` — React hook that exposes the LAN sync client's status
 * to the UI layer without statically importing `@cachink/sync-lan`.
 *
 * Importing `@cachink/sync-lan` statically would pull the protocol codec,
 * axum-protocol types, and push/pull loop into Local-standalone and Cloud
 * bundles where they're never used — contradicting CLAUDE.md §7 (local-first
 * is default, sync is additive). This module uses a dynamic `import()`
 * gated on `mode === 'lan'` so the payload only ships when it's needed.
 *
 * Types reach into `@cachink/sync-lan` are deliberately replaced with a
 * narrow local contract so ESLint's layer boundaries + the bundler both
 * see zero compile-time edge. The dynamic `await import(...)` is cast to
 * the contract at call time.
 */

import type { CachinkDatabase } from '@cachink/data';

export type LanSyncStatus = 'idle' | 'connecting' | 'syncing' | 'online' | 'offline' | 'error';

export interface LanSyncState {
  status: LanSyncStatus;
  lastServerSeq: number;
  connectedDevices: number;
  lastError: string | null;
}

export interface InitLanSyncArgs {
  db: CachinkDatabase;
  deviceId: string;
  serverUrl: string;
  accessToken: string;
}

/** Handle returned by {@link initLanSync}. Call `dispose()` on unmount. */
export interface LanSyncHandle {
  dispose: () => Promise<void>;
  getState: () => LanSyncState;
  subscribe: (listener: (state: LanSyncState) => void) => () => void;
  retryNow: () => Promise<void>;
}

/**
 * Shape we expect the lazy-loaded `@cachink/sync-lan` module to export.
 * Duplicated here (rather than imported) so this file creates no static
 * dependency edge to the sync-lan package. The cast happens at runtime
 * inside `initLanSync`.
 */
interface LazyLanSyncModule {
  createLanSyncClient: (args: InitLanSyncArgs) => LanClientHandle;
}

interface LanClientHandle {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  retryNow: () => Promise<void>;
  addListener: (listener: (snapshot: LanSyncSnapshot) => void) => () => void;
}

interface LanSyncSnapshot {
  status: LanSyncStatus;
  lastServerSeq: number;
  connectedDevices: number;
  lastError: string | null;
}

const INITIAL_STATE: LanSyncState = {
  status: 'idle',
  lastServerSeq: 0,
  connectedDevices: 0,
  lastError: null,
};

/**
 * Lazily instantiate the LAN sync client and return a lightweight handle.
 * Importing this function does NOT pull `@cachink/sync-lan` into the bundle;
 * the dynamic `import()` does, only when the function is called.
 *
 * Uses a literal-string dynamic import so Vite/Rollup splits
 * `@cachink/sync-lan` into the dedicated `sync-lan-*.js` chunk
 * declared in `apps/desktop/vite.config.ts`'s `manualChunks` rule
 * (Slice 8 M2-C11). The boundary test (`lan-bridge.boundary.test.ts`)
 * permits the dynamic-import form — only static `import ... from
 * '@cachink/sync-lan'` is forbidden in `packages/ui/src/**`.
 * `@cachink/sync-lan` is declared as an OPTIONAL `peerDependency` of
 * `@cachink/ui` so type resolution succeeds without making sync-lan
 * required at install time for Local-only consumers.
 */
export async function initLanSync(args: InitLanSyncArgs): Promise<LanSyncHandle> {
  const mod = (await import('@cachink/sync-lan')) as unknown as LazyLanSyncModule;
  const client = mod.createLanSyncClient(args);
  let cached: LanSyncState = { ...INITIAL_STATE };
  const listeners = new Set<(state: LanSyncState) => void>();

  const unsubscribe = client.addListener((snapshot) => {
    cached = {
      status: snapshot.status,
      lastServerSeq: snapshot.lastServerSeq,
      connectedDevices: snapshot.connectedDevices,
      lastError: snapshot.lastError,
    };
    for (const listener of listeners) listener(cached);
  });

  await client.start();

  return {
    async dispose() {
      unsubscribe();
      await client.stop();
      listeners.clear();
    },
    getState: () => ({ ...cached }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    retryNow: () => client.retryNow(),
  };
}

/**
 * Mode-gated initialiser. Safe to call from any bootstrap path — returns
 * `null` when the active mode is anything other than `'lan'`, so Local
 * and Cloud users never pay the dynamic-import cost.
 */
export async function initLanSyncIfMode(
  mode: string,
  args: InitLanSyncArgs,
): Promise<LanSyncHandle | null> {
  if (mode !== 'lan') return null;
  return initLanSync(args);
}
