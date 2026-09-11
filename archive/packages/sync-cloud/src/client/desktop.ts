/**
 * `createDesktopPowerSyncDb` — desktop counterpart of the mobile
 * factory, using `@powersync/web` (Slice 8 C5). The web SDK uses
 * IndexedDB / sqlite-wasm under the hood, but the surface we depend on
 * is identical to the React Native variant.
 *
 * Both apps' shells call this and feed the resulting Drizzle handle
 * into `<DatabaseProvider database={handle.db}>`. The cloud branch in
 * the database provider falls back to the local SQLite when no PowerSync
 * handle is provided.
 */

import type { CachinkDatabase } from '@cachink/data';
import { createDrizzleAdapter, type PowerSyncLike } from '../bridge/index.js';
import { buildPowerSyncSchema, type PowerSyncDsl } from './build-schema.js';

export interface DesktopPowerSyncCtor {
  new (config: { schema: unknown; database: { dbFilename: string } }): PowerSyncLike;
}

export interface CreateDesktopPowerSyncDbArgs {
  readonly dsl: PowerSyncDsl;
  readonly Database: DesktopPowerSyncCtor;
  readonly dbFilename?: string;
}

export interface DesktopPowerSyncHandle {
  readonly db: CachinkDatabase;
  readonly client: PowerSyncLike;
}

export function createDesktopPowerSyncDb(
  args: CreateDesktopPowerSyncDbArgs,
): DesktopPowerSyncHandle {
  const schema = buildPowerSyncSchema(args.dsl);
  const client = new args.Database({
    schema,
    database: { dbFilename: args.dbFilename ?? 'cachink.db' },
  });
  return {
    client,
    db: createDrizzleAdapter(client),
  };
}
