/**
 * useAuditedMutation — wraps useMutation with automatic audit logging.
 *
 * For hooks that DON'T go through a UseCase class (eliminar-*, crear-*
 * that call repos directly). Logs on success + error.
 *
 * Usage:
 * ```ts
 * return useAuditedMutation(
 *   { operation: 'venta.eliminar', entityType: 'sale', extractEntityId: ... },
 *   { mutationFn: ..., onSuccess: ... },
 * );
 * ```
 */

import { ulid } from 'ulid';
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { AuditOperation, AuditEvent } from '@cachink/observability';
import { useLogStore } from './observability-provider';
import { useDeviceId, useUserId, useCurrentBusinessId } from '../app-config/index';
import { addAuditBreadcrumb } from './sentry-breadcrumbs';

export interface AuditedMutationConfig<TInput, TOutput> {
  readonly operation: AuditOperation;
  readonly entityType: string;
  readonly extractEntityId: (result: TOutput, input: TInput) => string;
  readonly extractMetadata?: (input: TInput, result?: TOutput) => Record<string, unknown>;
}

/**
 * Wrap a `useMutation` call with automatic audit + error logging.
 *
 * The wrapper:
 *   1. Delegates to the original `mutationFn`.
 *   2. On success: writes an `AuditEvent` with `status: 'success'`.
 *   3. On error: writes an `AuditEvent` with `status: 'error'` + an `ErrorLogEntry`.
 *   4. Calls any original `onSuccess` / `onError` callbacks unchanged.
 */
function buildSuccessEvent<TInput, TOutput>(
  config: AuditedMutationConfig<TInput, TOutput>,
  result: TOutput,
  input: TInput,
  userId: string | null,
  deviceId: string,
  businessId: string,
): AuditEvent {
  return {
    id: ulid(),
    timestamp: new Date().toISOString(),
    operation: config.operation,
    entityType: config.entityType,
    entityId: config.extractEntityId(result, input),
    userId,
    deviceId,
    businessId,
    metadata: config.extractMetadata?.(input, result),
    status: 'success',
  };
}

function buildErrorEvent<TInput, TOutput>(
  config: AuditedMutationConfig<TInput, TOutput>,
  error: Error,
  input: TInput,
  userId: string | null,
  deviceId: string,
  businessId: string,
): AuditEvent {
  return {
    id: ulid(),
    timestamp: new Date().toISOString(),
    operation: config.operation,
    entityType: config.entityType,
    entityId: '',
    userId,
    deviceId,
    businessId,
    metadata: config.extractMetadata?.(input),
    status: 'error',
    errorCode: error.name,
    errorMessage: error.message,
  };
}

function logError<TInput, TOutput>(
  config: AuditedMutationConfig<TInput, TOutput>,
  error: Error,
  input: TInput,
  logStore: ReturnType<typeof useLogStore>,
  userId: string | null,
  deviceId: string,
  businessId: string,
): void {
  const event = buildErrorEvent(config, error, input, userId, deviceId, businessId);
  addAuditBreadcrumb(event);
  void logStore?.writeAudit(event).catch(() => {});
  void logStore
    ?.writeError({
      id: ulid(),
      timestamp: new Date().toISOString(),
      source: 'ui',
      operation: config.operation,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      userId,
      deviceId,
      businessId: businessId || null,
      context: config.extractMetadata?.(input),
    })
    .catch(() => {});
}

export function useAuditedMutation<TInput, TOutput>(
  config: AuditedMutationConfig<NoInfer<TInput>, NoInfer<TOutput>>,
  mutationOptions: UseMutationOptions<TOutput, Error, TInput>,
): UseMutationResult<TOutput, Error, TInput> {
  const logStore = useLogStore();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const businessId = useCurrentBusinessId();
  const uid = userId ?? null;
  const did = deviceId ?? '';
  const bid = businessId ?? '';

  return useMutation<TOutput, Error, TInput>({
    ...mutationOptions,
    async mutationFn(input: TInput) {
      if (!mutationOptions.mutationFn)
        throw new Error('useAuditedMutation: mutationFn is required');
      return mutationOptions.mutationFn(input);
    },
    onSuccess(result, input, context) {
      const event = buildSuccessEvent(config, result, input, uid, did, bid);
      addAuditBreadcrumb(event);
      void logStore?.writeAudit(event).catch(() => {});
      mutationOptions.onSuccess?.(result, input, context);
    },
    onError(error, input, context) {
      logError(config, error, input, logStore, uid, did, bid);
      mutationOptions.onError?.(error, input, context);
    },
  });
}
