/**
 * `useDesktopCloudHandle` — desktop shell's `useCloudHandle` factory
 * (Slice 9.6 T06e).
 *
 * Mirror of `apps/mobile/src/shell/use-cloud-handle.ts` using
 * `@powersync/web` + `createDesktopPowerSyncDb`. Like the mobile
 * variant, the dynamic import gracefully degrades to local SQLite
 * when `@powersync/web` isn't installed (Phase 1E "Manual install"
 * carry-over).
 */

import { useEffect, useState } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import { useMode } from '@cachink/ui';
import { loadDesktopPowerSyncDb } from './load-cloud-db';

export { loadDesktopPowerSyncDb } from './load-cloud-db';

export function useDesktopCloudHandle(): CachinkDatabase | null {
  const mode = useMode();
  const [handle, setHandle] = useState<CachinkDatabase | null>(null);

  useEffect(() => {
    if (mode !== 'cloud') {
      setHandle(null);
      return;
    }
    let cancelled = false;
    void loadDesktopPowerSyncDb()
      .then((db) => {
        if (!cancelled) setHandle(db);
      })
      .catch((err: unknown) => {
        console.warn(
          '[useDesktopCloudHandle] PowerSync not available, staying on local SQLite:',
          err,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return handle;
}
