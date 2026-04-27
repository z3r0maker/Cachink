/**
 * `CloudDatabaseProvider` — swaps the active `DatabaseContext` value to a
 * PowerSync-backed `CachinkDatabase` when the app is in Cloud mode AND
 * the shell has produced a handle (Slice 8 C5).
 *
 * Mounted *inside* `AppProviders` (after `DrizzleAppConfigBridge` hydrates
 * the Zustand store) so it can read `mode` reactively. When the
 * conditions aren't met it just renders children — the local SQLite
 * `DatabaseProvider` outside still owns the context value.
 *
 * The handle's lifecycle is the shell's responsibility: it builds the
 * PowerSync database via `createMobile/DesktopPowerSyncDb` from
 * `@cachink/sync-cloud/client` once the user has signed in (and the
 * handle becomes the value here).
 */

import type { ReactElement, ReactNode } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import { useMode } from '../app-config/index';
import { DatabaseContext } from './_internal';

export interface CloudDatabaseProviderProps {
  readonly cloudHandle: CachinkDatabase | null;
  readonly children: ReactNode;
}

export function CloudDatabaseProvider(props: CloudDatabaseProviderProps): ReactElement {
  const mode = useMode();
  if (mode === 'cloud' && props.cloudHandle) {
    return (
      <DatabaseContext.Provider value={props.cloudHandle}>
        {props.children}
      </DatabaseContext.Provider>
    );
  }
  return <>{props.children}</>;
}
