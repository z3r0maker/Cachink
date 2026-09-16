/**
 * Internal bridge components for AppProviders.
 *
 * Extracted from app-providers.tsx to keep file size under 200 lines
 * (CLAUDE.md 2.6).
 */

import { useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { DrizzleAppConfigRepository } from '@xangarro/data';
import { PlanLimitError } from '@xangarro/domain';
import type { LogStore } from '@xangarro/observability';
import { usePlanLimitStore } from '../entitlement/plan-limit-store';
import { useDatabase } from '../database/index';
import {
  AppConfigProvider,
  useAppConfigHydrated,
  useCrashReportingEnabled,
  useDeviceId,
  useUserId,
} from '../app-config/index';
import { captureException, initSentryIfConsented } from '../telemetry/index';
import { useErrorToastStore } from '../observability/error-toast-store';
import { buildDrizzleRepositories, RepositoryProvider } from './repository-provider';

export function DrizzleAppConfigBridge({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const db = useDatabase();
  const repo = useMemo(() => new DrizzleAppConfigRepository(db), [db]);
  return <AppConfigProvider appConfig={repo}>{children}</AppConfigProvider>;
}

export function DrizzleRepositoryBridge({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement | null {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const repositories = useMemo(() => {
    if (!deviceId) return null;
    return buildDrizzleRepositories(db, deviceId, userId);
  }, [db, deviceId, userId]);
  if (!repositories) return null;
  return <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>;
}

export function TelemetryBridge({ children }: { readonly children: ReactNode }): ReactElement {
  const hydrated = useAppConfigHydrated();
  const consent = useCrashReportingEnabled();
  useEffect(() => {
    if (!hydrated) return;
    void initSentryIfConsented(consent);
  }, [hydrated, consent]);
  return <>{children}</>;
}

export { ObservabilityBridge, type ObservabilityBridgeProps } from './observability-bridge';

export function buildQueryClient(logStoreRef: { current: LogStore | null }): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 0, staleTime: Infinity },
      mutations: {
        onError(error) {
          const store = logStoreRef.current;
          if (store) {
            void store
              .writeError({
                id: '',
                timestamp: new Date().toISOString(),
                source: 'ui',
                errorName: error instanceof Error ? error.name : 'UnknownError',
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined,
                userId: null,
                deviceId: '',
                businessId: null,
              })
              .catch(() => {});
          }
          // A plan limit is not a failure: explain it instead of toasting (A-10).
          if (error instanceof PlanLimitError) {
            usePlanLimitStore.getState().show(error);
            return;
          }
          useErrorToastStore.getState().push({
            message: error instanceof Error ? error.message : 'Algo salió mal',
            severity: 'error',
          });
          if (error instanceof Error) captureException(error);
        },
      },
    },
  });
}
