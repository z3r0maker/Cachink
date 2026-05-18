/**
 * useAuditedUseCase — hook that wraps a use case with audit logging.
 *
 * Returns the same use case if LogStore is not available (graceful degradation).
 * The AuditContext is built from app-config hooks (deviceId, userId, businessId).
 * Also adds Sentry breadcrumbs on each audited operation (Phase B2).
 */

import { useMemo } from 'react';
import { AuditedUseCase, type AuditedUseCaseConfig, type AuditEvent, type LogStore } from '@cachink/observability';
import { useDeviceId, useUserId } from '../app-config/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useLogStore } from './observability-provider';
import { addAuditBreadcrumb } from './sentry-breadcrumbs';

/** Minimal use-case interface. */
interface Executable<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/** Wrapper that intercepts writeAudit to add Sentry breadcrumbs. */
function withBreadcrumbs(store: LogStore): LogStore {
  return {
    ...store,
    async writeAudit(event: AuditEvent): Promise<void> {
      addAuditBreadcrumb(event);
      return store.writeAudit(event);
    },
  };
}

/**
 * Wrap a use case with audit logging. If LogStore is not available,
 * returns the original use case unchanged (no-op in tests).
 */
export function useAuditedUseCase<TInput, TOutput>(
  useCase: Executable<TInput, TOutput>,
  config: AuditedUseCaseConfig<TInput, TOutput>,
): Executable<TInput, TOutput> {
  const logStore = useLogStore();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const businessId = useCurrentBusinessId();

  return useMemo(() => {
    if (!logStore || !deviceId || !businessId) return useCase;

    const storeWithBreadcrumbs = withBreadcrumbs(logStore);
    return new AuditedUseCase(useCase, storeWithBreadcrumbs, config, {
      deviceId,
      userId,
      businessId,
    });
  }, [useCase, logStore, deviceId, userId, businessId, config]);
}
