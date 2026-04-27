/**
 * `@cachink/sync-cloud/client` — PowerSync client factories (Slice 8 C5).
 *
 * Mobile and desktop shells each pick the matching factory; both return
 * a handle whose `.db` is a Drizzle-typed `CachinkDatabase` so existing
 * repositories work unchanged.
 */

export {
  createMobilePowerSyncDb,
  type CreateMobilePowerSyncDbArgs,
  type MobilePowerSyncCtor,
  type MobilePowerSyncHandle,
} from './mobile.js';
export {
  createDesktopPowerSyncDb,
  type CreateDesktopPowerSyncDbArgs,
  type DesktopPowerSyncCtor,
  type DesktopPowerSyncHandle,
} from './desktop.js';
export {
  buildPowerSyncSchema,
  type PowerSyncDsl,
  type PowerSyncColumnFactory,
  type PowerSyncTableCtor,
  type PowerSyncSchemaCtor,
} from './build-schema.js';
