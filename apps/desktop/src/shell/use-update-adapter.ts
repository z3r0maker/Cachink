/**
 * `useDesktopUpdateAdapter` — produces an `UpdateAdapter` for
 * `useCheckForUpdates` driven by `@tauri-apps/plugin-updater` (Slice
 * 9.6 T11).
 *
 * The Tauri plugin is wired on the Rust side
 * (`tauri_plugin_updater::Builder::new().build()` in src-tauri/src/lib.rs).
 * The JS-side companion `@tauri-apps/plugin-updater` is dynamically
 * imported so the desktop bundle stays small when no update is being
 * checked. When the dep is missing the adapter resolves to `null`
 * and `useCheckForUpdates` returns `'unsupported'`.
 */

import { useEffect, useState } from 'react';
import type { UpdateAdapter } from '@cachink/ui';

interface TauriUpdaterShape {
  check: () => Promise<{
    available: boolean;
    downloadAndInstall: () => Promise<void>;
  } | null>;
}

export function useDesktopUpdateAdapter(): UpdateAdapter | null {
  const [adapter, setAdapter] = useState<UpdateAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDesktopUpdateAdapter()
      .then((loaded) => {
        if (!cancelled) setAdapter(loaded);
      })
      .catch(() => {
        // @tauri-apps/plugin-updater not installed yet — leave null.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return adapter;
}

export async function loadDesktopUpdateAdapter(): Promise<UpdateAdapter | null> {
  const moduleId = ['@tauri-apps', 'plugin-updater'].join('/');
  const mod = (await import(/* @vite-ignore */ moduleId)) as Partial<TauriUpdaterShape>;
  if (!mod.check) return null;
  const tauri = mod as TauriUpdaterShape;
  let pending: Awaited<ReturnType<TauriUpdaterShape['check']>> = null;
  return {
    async check() {
      const result = await tauri.check();
      pending = result;
      if (!result || !result.available) return 'up-to-date';
      return { ready: true };
    },
    async applyIfReady() {
      if (pending && pending.available) {
        await pending.downloadAndInstall();
      }
    },
  };
}
