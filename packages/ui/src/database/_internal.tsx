/**
 * Internal database-provider primitives shared across platform variants.
 *
 * Kept as a single non-platform-extension file so the React Context + hook
 * identity stays consistent whether the mobile `.native.tsx` or the
 * desktop `.web.tsx` implementation renders the provider. Not re-exported
 * from the package barrel — consumers use `useDatabase` + `DatabaseProvider`
 * from `@cachink/ui`.
 *
 * `AsyncDatabaseProvider` is the testable workhorse: a generic provider
 * that takes a factory function and renders children once it resolves.
 * Platform variants (expo-sqlite, Tauri) are thin wrappers that pass their
 * platform-specific factory. This lets unit tests cover the async-lifecycle
 * behaviour without mounting a real SQLite driver.
 */

import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import { DatabaseErrorState } from './database-error-state';
import type { ResetDatabaseFn } from './database-reset';
import { useDatabaseLifecycle } from './use-database-lifecycle';

/**
 * React Context carrying the initialized database. `null` = provider not yet
 * mounted or still loading. Consumers must call {@link useDatabase} which
 * throws a descriptive error if read outside the provider tree.
 */
export const DatabaseContext = createContext<CachinkDatabase | null>(null);

/**
 * Hook: read the current database. Throws if called outside a
 * {@link DatabaseProvider}. Prefer this over reading the Context directly
 * so the error message surfaces at the call site, not inside Drizzle.
 */
export function useDatabase(): CachinkDatabase {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error(
      'useDatabase() must be called inside <DatabaseProvider>. Check that ' +
        'the component tree is wrapped in <AppProviders>.',
    );
  }
  return db;
}

export interface DatabaseProviderProps {
  readonly children: ReactNode;
  /**
   * Test-only: inject a pre-built database. Bypasses the async platform
   * factory and renders children synchronously. In production each app's
   * shell mounts <DatabaseProvider> with no prop so the platform-specific
   * factory kicks in.
   */
  readonly database?: CachinkDatabase;
}

export interface AsyncDatabaseProviderProps extends DatabaseProviderProps {
  /**
   * Platform-specific factory that opens SQLite, wraps it with Drizzle,
   * and runs pending migrations. Called exactly once per mount.
   */
  readonly create: () => Promise<CachinkDatabase>;
  /** Optional platform reset hook that recreates the SQLite file from scratch. */
  readonly reset?: ResetDatabaseFn;
}

/**
 * Generic async-database provider. Both the `.native.tsx` (expo-sqlite) and
 * `.web.tsx` (Tauri) implementations wrap children in this component with
 * their platform `create` function so the lifecycle and error behaviour
 * stays uniform.
 *
 * Renders `null` while `create` is in flight — on mobile the Expo splash
 * screen remains visible; on desktop the Tauri window shows its background
 * color. Once the factory resolves, children mount with the db available
 * via {@link useDatabase}.
 */
export function AsyncDatabaseProvider(props: AsyncDatabaseProviderProps): ReactElement | null {
  const lifecycle = useDatabaseLifecycle({
    create: props.create,
    reset: props.reset,
    preInitialised: props.database,
  });
  if (lifecycle.error) {
    return (
      <DatabaseErrorState
        error={lifecycle.error}
        copied={lifecycle.copied}
        resetOpen={lifecycle.resetOpen}
        resetting={lifecycle.resetting}
        canReset={props.reset != null}
        onRetry={lifecycle.handleRetry}
        onCopy={lifecycle.handleCopy}
        onReset={() => {
          void lifecycle.handleReset();
        }}
        onResetOpenChange={lifecycle.setResetOpen}
      />
    );
  }
  if (lifecycle.loading || !lifecycle.db) return null;
  return <DatabaseContext.Provider value={lifecycle.db}>{props.children}</DatabaseContext.Provider>;
}

/**
 * Test-only: wraps children in the context with a given db. Prefer this
 * over {@link AsyncDatabaseProvider} in component tests where the db
 * lifecycle is irrelevant to what's being tested.
 */
export function TestDatabaseProvider(props: {
  readonly children: ReactNode;
  readonly database: CachinkDatabase;
}): ReactElement {
  return (
    <DatabaseContext.Provider value={props.database}>{props.children}</DatabaseContext.Provider>
  );
}
