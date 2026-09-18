import type { Db, Tx } from '../db/client';
import { drizzlePlatformFlags } from '../db/platform-flags';
import { drizzleTenantDirectory } from '../db/tenants';
import type { PlatformFlagStore } from './port';
import type { TenantDirectory } from '../tenants/port';

/** The one place the flag page's adapters are chosen. */
export function flagDeps(conn: Db | Tx): {
  readonly store: PlatformFlagStore;
  readonly directory: TenantDirectory;
} {
  return { store: drizzlePlatformFlags(conn), directory: drizzleTenantDirectory(conn) };
}
