/**
 * useAuditedUseCase — hook that wraps a use case with audit logging.
 *
 * Returns the same use case if LogStore is not available (graceful degradation).
 * The AuditContext is built from app-config hooks (deviceId, userId, businessId).
 * Also adds Sentry breadcrumbs on each audited operation (Phase B2).
 */

import { useMemo } from 'react';
import {
  AuditedUseCase,
  type AuditedUseCaseConfig,
  type AuditEvent,
  type LogStore,
} from '@xangarro/observability';
import { useDeviceId, useUserId } from '../app-config/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useLogStore } from './observability-provider';
import { addAuditBreadcrumb } from './sentry-breadcrumbs';

/** Minimal use-case interface. */
interface Executable<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Wrapper that intercepts writeAudit to add Sentry breadcrumbs.
 *
 * Delegates every method explicitly. An object spread (`{ ...store }`) copies
 * no methods from a class-based store — they live on the prototype and use
 * private fields — so a failing use case used to throw
 * "writeError is not a function", hiding its real error from the UI.
 */
export function withBreadcrumbs(store: LogStore): LogStore {
  return {
    writeAudit: async (event: AuditEvent) => {
      addAuditBreadcrumb(event);
      return store.writeAudit(event);
    },
    writeError: (entry) => store.writeError(entry),
    queryAudit: (opts) => store.queryAudit(opts),
    queryErrors: (opts) => store.queryErrors(opts),
    queryTimeline: (opts) => store.queryTimeline(opts),
    stats: (since) => store.stats(since),
    prune: (days) => store.prune(days),
    exportSnapshot: (opts) => store.exportSnapshot(opts),
    queryUnshippedErrors: store.queryUnshippedErrors?.bind(store),
    markShipped: store.markShipped?.bind(store),
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
