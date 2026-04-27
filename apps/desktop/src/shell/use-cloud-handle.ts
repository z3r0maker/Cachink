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
  createDesktopPowerSyncDb(args: {
    dsl: {
      column: PowerSyncRuntime['column'];
      Table: PowerSyncRuntime['Table'];
      Schema: PowerSyncRuntime['Schema'];
    };
    Database: PowerSyncRuntime['PowerSyncDatabase'];
  }): { db: CachinkDatabase };
}

export async function loadDesktopPowerSyncDb(): Promise<CachinkDatabase | null> {
  // Constructed-string + `@vite-ignore` so the @powersync/web type
  // surface (which we deliberately narrow via `PowerSyncRuntime`) does
  // not flow back into the call site — the cast happens via `unknown`.
  // The package IS now a direct desktop dep (Slice 8 M2-C10) so
  // resolution always succeeds at runtime; the indirect string is
  // purely a type-narrowing tool. Rollup splits the package into the
  // `sync-cloud` chunk declared in `vite.config.ts`'s `manualChunks`
  // when the cloud client is statically imported via the bridge.
  const moduleId = ['@powersync', 'web'].join('/');
  const clientId = ['@cachink', 'sync-cloud', 'client'].join('/');
  const [ps, factory] = (await Promise.all([
    import(/* @vite-ignore */ moduleId),
    import(/* @vite-ignore */ clientId),
  ])) as unknown as [PowerSyncRuntime | undefined, CloudClientRuntime];
  if (!ps) return null;
  const handle = factory.createDesktopPowerSyncDb({
    dsl: { column: ps.column, Table: ps.Table, Schema: ps.Schema },
    Database: ps.PowerSyncDatabase,
  });
  return handle.db;
}
