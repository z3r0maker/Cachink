/**
 * `createMobilePowerSyncDb` — instantiate a PowerSync database against
 * the React Native SDK and hand the handle to `createDrizzleAdapter`
 * (Slice 8 C5).
 *
 * The mobile shell imports `@powersync/react-native` and passes the
 * `PowerSyncDatabase` ctor + the schema DSL into this factory. We keep
 * the dependency at the shell layer (per CLAUDE.md §7's lazy-load
 * contract) — `@cachink/sync-cloud` itself never declares the native
 * module as a `dependency`.
 *
 * The returned `CachinkDatabase` is a fully-typed Drizzle handle that
 * the existing repositories work against without modification.
 */

import type { CachinkDatabase } from '@cachink/data';
import { createDrizzleAdapter, type PowerSyncLike } from '../bridge/index.js';
import { buildPowerSyncSchema, type PowerSyncDsl } from './build-schema.js';

export interface MobilePowerSyncCtor {
  new (config: { schema: unknown; database: { dbFilename: string } }): PowerSyncLike;
}

export interface CreateMobilePowerSyncDbArgs {
  /** PowerSync DSL pulled from `@powersync/react-native` by the shell. */
  readonly dsl: PowerSyncDsl;
  /** PowerSync `PowerSyncDatabase` constructor. */
  readonly Database: MobilePowerSyncCtor;
  /** SQLite file name (defaults to `cachink.db`). */
  readonly dbFilename?: string;
}

export interface MobilePowerSyncHandle {
  readonly db: CachinkDatabase;
  readonly client: PowerSyncLike;
}

export function createMobilePowerSyncDb(args: CreateMobilePowerSyncDbArgs): MobilePowerSyncHandle {
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
