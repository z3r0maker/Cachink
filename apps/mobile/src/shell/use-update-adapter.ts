/**
 * `useMobileUpdateAdapter` — produces an `UpdateAdapter` for
 * `useCheckForUpdates` driven by `expo-updates` (Slice 9.6 T11).
 *
 * `expo-updates` is declared in `apps/mobile/package.json` and
 * configured in `app.json` (Phase 1F-M2-T07). At runtime Metro
 * resolves the lazy `await import('expo-updates')` and Expo
 * auto-links the native module via `expo-modules-core`.
 *
 * In Vitest (Node) the same dynamic import rejects with
 * `ERR_MODULE_NOT_FOUND` because `expo-updates`'s ESM entry
 * re-exports `./Updates` without a `.js` suffix — Node's strict
 * resolver refuses it. The shell hook's `.catch` swallows that
 * rejection and leaves `adapter === null`, which
 * `useCheckForUpdates` reports as `'unsupported'` (the disabled
 * Settings row).
 *
 * Returns `null` when the module loads but doesn't expose the
 * expected API surface.
 */

import { useEffect, useState } from 'react';
import type { UpdateAdapter } from '@cachink/ui';

interface ExpoUpdatesShape {
  checkForUpdateAsync: () => Promise<{ isAvailable: boolean }>;
  fetchUpdateAsync: () => Promise<{ isNew: boolean }>;
  reloadAsync: () => Promise<void>;
}

export function useMobileUpdateAdapter(): UpdateAdapter | null {
  const [adapter, setAdapter] = useState<UpdateAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMobileUpdateAdapter()
      .then((loaded) => {
        if (!cancelled) setAdapter(loaded);
      })
      .catch(() => {
        // expo-updates not installed (tests, web preview) — leave null.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return adapter;
}

export async function loadMobileUpdateAdapter(): Promise<UpdateAdapter | null> {
  const mod = (await import('expo-updates')) as Partial<ExpoUpdatesShape>;
  if (!mod.checkForUpdateAsync || !mod.fetchUpdateAsync || !mod.reloadAsync) return null;
  const expo = mod as ExpoUpdatesShape;
  return {
    async check() {
      const result = await expo.checkForUpdateAsync();
      if (!result.isAvailable) return 'up-to-date';
      const fetched = await expo.fetchUpdateAsync();
      return { ready: fetched.isNew };
    },
    async applyIfReady() {
      await expo.reloadAsync();
    },
  };
}
