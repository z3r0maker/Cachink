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
export function useAuditedMutation<TInput, TOutput>(
  config: AuditedMutationConfig<NoInfer<TInput>, NoInfer<TOutput>>,
  mutationOptions: UseMutationOptions<TOutput, Error, TInput>,
): UseMutationResult<TOutput, Error, TInput> {
  const logStore = useLogStore();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const businessId = useCurrentBusinessId();

  return useMutation<TOutput, Error, TInput>({
    ...mutationOptions,

    async mutationFn(input: TInput) {
      if (!mutationOptions.mutationFn) {
        throw new Error('useAuditedMutation: mutationFn is required');
      }
      return mutationOptions.mutationFn(input);
    },

    onSuccess(result, input, context) {
      const event: AuditEvent = {
        id: ulid(),
        timestamp: new Date().toISOString(),
        operation: config.operation,
        entityType: config.entityType,
        entityId: config.extractEntityId(result, input),
        userId: userId ?? null,
        deviceId: deviceId ?? '',
        businessId: businessId ?? '',
        metadata: config.extractMetadata?.(input, result),
        status: 'success',
      };

      addAuditBreadcrumb(event);
      void logStore?.writeAudit(event).catch(() => {});

      mutationOptions.onSuccess?.(result, input, context);
    },

    onError(error, input, context) {
      const event: AuditEvent = {
        id: ulid(),
        timestamp: new Date().toISOString(),
        operation: config.operation,
        entityType: config.entityType,
        entityId: '',
        userId: userId ?? null,
        deviceId: deviceId ?? '',
        businessId: businessId ?? '',
        metadata: config.extractMetadata?.(input),
        status: 'error',
        errorCode: error.name,
        errorMessage: error.message,
      };

      addAuditBreadcrumb(event);
      void logStore?.writeAudit(event).catch(() => {});

      void logStore?.writeError({
        id: ulid(),
        timestamp: new Date().toISOString(),
        source: 'ui',
        operation: config.operation,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        userId: userId ?? null,
        deviceId: deviceId ?? '',
        businessId: businessId ?? null,
        context: config.extractMetadata?.(input),
      }).catch(() => {});

      mutationOptions.onError?.(error, input, context);
    },
  });
}
