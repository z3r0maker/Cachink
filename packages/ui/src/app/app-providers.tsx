/**
 * AppProviders — the one wrapper both apps mount.
 *
 * Composes the five providers the rest of the codebase assumes are live,
 * in the order they depend on each other:
 *
 *   1. `TamaguiProvider` — Tamagui primitives (§8) need it before render.
 *   2. `QueryClientProvider` — TanStack Query is the async cache for all
 *      repository hooks.
 *   3. `DatabaseProvider` — opens SQLite + runs migrations. Children wait
 *      for the db before mounting.
 *   4. `DrizzleAppConfigBridge` — builds `DrizzleAppConfigRepository` from
 *      the db and wraps children in `AppConfigProvider`. Hydrates the
 *      Zustand store with deviceId + mode + currentBusinessId. Renders
 *      null while hydration is in flight (splash stays visible).
 *   5. `DrizzleRepositoryBridge` — builds the 11 Drizzle repositories from
 *      the db + hydrated deviceId and wraps children in
 *      `RepositoryProvider`. Screens + hooks read repos from here.
 *
 * App-shell roots (`apps/mobile/src/app/_layout.tsx`,
 * `apps/desktop/src/app/main.tsx`) swap their ad-hoc providers for a
 * single `<AppProviders>`. Tests never mount this — they use
 * `<MockRepositoryProvider>` + `<TestDatabaseProvider>` directly.
 */

import { useMemo, type ReactElement, type ReactNode } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DrizzleAppConfigRepository } from '@cachink/data';
import { tamaguiConfig } from '../tamagui.config';
import { DatabaseProvider, useDatabase } from '../database/index';
import { AppConfigProvider, useDeviceId } from '../app-config/index';
import { buildDrizzleRepositories, RepositoryProvider } from './repository-provider';

function DrizzleAppConfigBridge({ children }: { readonly children: ReactNode }): ReactElement {
  const db = useDatabase();
  const repo = useMemo(() => new DrizzleAppConfigRepository(db), [db]);
  return <AppConfigProvider appConfig={repo}>{children}</AppConfigProvider>;
}

function DrizzleRepositoryBridge({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement | null {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const repositories = useMemo(() => {
    if (!deviceId) return null;
    return buildDrizzleRepositories(db, deviceId);
  }, [db, deviceId]);
  if (!repositories) return null;
  return <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>;
}

function buildQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Repositories are local SQLite; network-flakiness retries make no
        // sense. Let errors surface immediately to the UI.
        retry: 0,
        // Stale data in a local-first app only happens after the same
        // process mutates — mark writes invalidate the key explicitly.
        staleTime: Infinity,
      },
    },
  });
}

export interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): ReactElement {
  const queryClient = useMemo(buildQueryClient, []);
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider>
          <DrizzleAppConfigBridge>
            <DrizzleRepositoryBridge>{children}</DrizzleRepositoryBridge>
          </DrizzleAppConfigBridge>
        </DatabaseProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
