/**
 * `useMobileCloudHandle` — mobile shell's `useCloudHandle` factory
 * (Slice 9.6 T06e).
 *
 * When the user runs in Cloud mode AND `@powersync/react-native` is
 * installed, this hook instantiates a PowerSync-backed
 * `CachinkDatabase` via `createMobilePowerSyncDb` and returns it.
 * `<AppProviders>` then swaps the active database context so every
 * repository reads/writes through PowerSync instead of local SQLite.
 *
 * `@powersync/react-native` is NOT yet in `apps/mobile/package.json`
 * — it's a "Manual install" carry-over from Phase 1E (see
 * ROADMAP-archive.md). The dynamic `import()` below catches the
 * ResolveError and returns `null` so the local-SQLite path still
 * works. Once the dep is added the hook activates automatically —
 * no further code changes required.
 */

import { useEffect, useState } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import { useMode } from '@cachink/ui';
import { loadMobilePowerSyncDb } from './load-cloud-db';

export { loadMobilePowerSyncDb } from './load-cloud-db';

export function useMobileCloudHandle(): CachinkDatabase | null {
  const mode = useMode();
  const [handle, setHandle] = useState<CachinkDatabase | null>(null);

  useEffect(() => {
    if (mode !== 'cloud') {
      setHandle(null);
      return;
    }
    let cancelled = false;
    void loadMobilePowerSyncDb()
      .then((db) => {
        if (!cancelled) setHandle(db);
      })
      .catch((err: unknown) => {
        console.warn(
          '[useMobileCloudHandle] PowerSync not available, staying on local SQLite:',
          err,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return handle;
}
