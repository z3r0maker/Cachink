/**
 * DatabaseProvider — Vite/Tauri variant (stub until Commit 2).
 *
 * Commit 2 of the Phase 1C slice wires this to `@tauri-apps/plugin-sql`
 * via the Drizzle `sqlite-proxy` driver. For Commit 1 we only ship the
 * contract — consumers are expected to pass the `database` prop (tests)
 * or mount the platform-specific `.native.tsx` variant on mobile. If this
 * file is accidentally invoked without a `database` prop in production,
 * the factory throws so the bug surfaces immediately rather than the app
 * hanging on a never-resolving splash screen.
 */

import type { ReactElement } from 'react';
import {
  AsyncDatabaseProvider,
  type DatabaseProviderProps,
  type AsyncDatabaseProviderProps,
} from './_internal';
import type { CachinkDatabase } from '@cachink/data';

function createPlaceholderDatabase(): Promise<CachinkDatabase> {
  return Promise.reject(
    new Error(
      'DatabaseProvider (.web) is a stub in Commit 1. Pass a `database` ' +
        'prop for tests, or wait for Commit 2 which wires @tauri-apps/plugin-sql.',
    ),
  );
}

export function DatabaseProvider(props: DatabaseProviderProps): ReactElement | null {
  const asyncProps: AsyncDatabaseProviderProps = {
    children: props.children,
    database: props.database,
    create: createPlaceholderDatabase,
  };
  return <AsyncDatabaseProvider {...asyncProps} />;
}
