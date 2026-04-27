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

interface PowerSyncRuntime {
  PowerSyncDatabase: new (config: { schema: unknown; database: { dbFilename: string } }) => unknown;
  Schema: new (t: Record<string, unknown>) => unknown;
  Table: new (c: { columns: Record<string, unknown> }) => unknown;
  column: {
    text(): unknown;
    integer(): unknown;
    real(): unknown;
    numeric(): unknown;
  };
}

interface CloudClientRuntime {
  createMobilePowerSyncDb(args: {
    dsl: {
      column: PowerSyncRuntime['column'];
      Table: PowerSyncRuntime['Table'];
      Schema: PowerSyncRuntime['Schema'];
    };
    Database: PowerSyncRuntime['PowerSyncDatabase'];
  }): { db: CachinkDatabase };
}

export async function loadMobilePowerSyncDb(): Promise<CachinkDatabase | null> {
  // Static `await import(...)` so Metro can emit `__loadBundleAsync(...)`
  // for both packages — the `processModuleFilter` rule in
  // `metro.config.js` keeps them out of the initial bundle (Slice 8
  // M2-C11), and `nodeModulesPaths` now includes
  // `packages/ui/node_modules` so Metro can locate the workspace peer
  // `@cachink/sync-cloud` even though it isn't a direct mobile dep.
  // At runtime Metro resolves the chunks; in Vitest (Node) it rejects
  // because `@powersync/react-native` isn't installed in the
  // workspace's node_modules — the regression test asserts the
  // rejection. The `unknown` cast is the type-narrowing tool;
  // narrowing happens via `PowerSyncRuntime` / `CloudClientRuntime`.
  const [ps, factory] = (await Promise.all([
    import('@powersync/react-native'),
    import('@cachink/sync-cloud/client'),
  ])) as unknown as [PowerSyncRuntime | undefined, CloudClientRuntime];
  if (!ps) return null;
  const handle = factory.createMobilePowerSyncDb({
    dsl: { column: ps.column, Table: ps.Table, Schema: ps.Schema },
    Database: ps.PowerSyncDatabase,
  });
  return handle.db;
}
