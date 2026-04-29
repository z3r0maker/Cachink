/**
 * Pure async loader for the mobile PowerSync database.
 *
 * Extracted from `use-cloud-handle.ts` so this module has ZERO React
 * or `@cachink/ui` imports. This keeps the Vitest module graph clean —
 * tests that only need `loadMobilePowerSyncDb` never touch
 * react-native's Flow source (which Rollup can't parse).
 */

import type { CachinkDatabase } from '@cachink/data';

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
