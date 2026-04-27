/**
 * `useCheckForUpdates` — surfaced in Settings as "Buscar actualizaciones"
 * (P1F-M2 C7 / ADR-036).
 *
 * Platform-extension pattern (CLAUDE.md §5.3) — the actual `expo-updates`
 * / `tauri-plugin-updater` invocation lives in the app shell. This hook
 * is a typed contract both implementations satisfy: call
 * `checkForUpdate()`, get back a `UpdateStatus`.
 *
 * When the hook is called without a platform-installed adapter, it
 * resolves to `'unsupported'` so the UI can still render the button
 * (disabled) without crashing in tests.
 */

import { useCallback, useState } from 'react';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'unsupported';

export interface UpdateAdapter {
  check(): Promise<'up-to-date' | { ready: boolean }>;
  applyIfReady?: () => Promise<void>;
}

export interface UseCheckForUpdatesResult {
  readonly status: UpdateStatus;
  readonly error: Error | null;
  readonly check: () => Promise<void>;
  readonly apply: () => Promise<void>;
}

const NOOP_ADAPTER: UpdateAdapter = {
  check: async () => 'up-to-date',
};

export function useCheckForUpdates(adapter: UpdateAdapter | null): UseCheckForUpdatesResult {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const active = adapter ?? NOOP_ADAPTER;

  const check = useCallback(async () => {
    if (!adapter) {
      setStatus('unsupported');
      return;
    }
    setStatus('checking');
    setError(null);
    try {
      const result = await active.check();
      if (result === 'up-to-date') {
        setStatus('up-to-date');
        return;
      }
      if (result.ready) {
        setStatus('downloaded');
        return;
      }
      setStatus('downloading');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter, active]);

  const apply = useCallback(async () => {
    if (!adapter || !adapter.applyIfReady) return;
    try {
      await adapter.applyIfReady();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter]);

  return { status, error, check, apply };
}
