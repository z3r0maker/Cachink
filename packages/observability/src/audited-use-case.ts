/**
 * AuditedUseCase — decorator that wraps a use-case with audit logging.
 *
 * On success: writes an AuditEvent with status='success'.
 * On error: writes an AuditEvent with status='error' + an ErrorLogEntry,
 * then re-throws the original error so callers still handle it.
 *
 * Usage:
 * ```ts
 * const audited = new AuditedUseCase(registrarVenta, logStore, {
 *   operation: 'venta.registrar',
 *   entityType: 'sale',
 *   extractEntityId: (result) => result.id,
 *   extractMetadata: (input, result) => ({ monto: input.montoCentavos }),
 * });
 * const sale = await audited.execute(input);
 * ```
 */

import { ulid } from 'ulid';
import type { AuditOperation, AuditEvent } from './audit-event.js';
import type { LogStore } from './log-store.js';

/** Context needed to stamp every audit event with device/user/business. */
export interface AuditContext {
  readonly deviceId: string;
  readonly userId: string | null;
  readonly businessId: string;
}

/** Config for an AuditedUseCase wrapper. */
export interface AuditedUseCaseConfig<TInput, TOutput> {
  readonly operation: AuditOperation;
  readonly entityType: string;
  readonly extractEntityId: (result: TOutput, input: TInput) => string;
  readonly extractMetadata?: (input: TInput, result?: TOutput) => Record<string, unknown>;
}

/** Minimal use-case interface (matches @cachink/application's UseCase<I,O>). */
interface Executable<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export class AuditedUseCase<TInput, TOutput> implements Executable<TInput, TOutput> {
  readonly #inner: Executable<TInput, TOutput>;
  readonly #logStore: LogStore;
  readonly #config: AuditedUseCaseConfig<TInput, TOutput>;
  readonly #context: AuditContext;

  constructor(
    inner: Executable<TInput, TOutput>,
    logStore: LogStore,
    config: AuditedUseCaseConfig<TInput, TOutput>,
    context: AuditContext,
  ) {
    this.#inner = inner;
    this.#logStore = logStore;
    this.#config = config;
    this.#context = context;
  }

  async execute(input: TInput): Promise<TOutput> {
    const startMs = Date.now();
    const timestamp = new Date().toISOString();
    const id = ulid();

    try {
      const result = await this.#inner.execute(input);
      const durationMs = Date.now() - startMs;

      const event: AuditEvent = {
        id,
        timestamp,
        operation: this.#config.operation,
        entityType: this.#config.entityType,
        entityId: this.#config.extractEntityId(result, input),
        userId: this.#context.userId,
        deviceId: this.#context.deviceId,
        businessId: this.#context.businessId,
        metadata: this.#config.extractMetadata?.(input, result),
        status: 'success',
        durationMs,
      };

      // Fire-and-forget — don't block the use case on logging
      void this.#logStore.writeAudit(event).catch(() => {});
      return result;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));

      const durationMs = Date.now() - startMs;

      const event: AuditEvent = {
        id,
        timestamp,
        operation: this.#config.operation,
        entityType: this.#config.entityType,
        entityId: '',
        userId: this.#context.userId,
        deviceId: this.#context.deviceId,
        businessId: this.#context.businessId,
        metadata: this.#config.extractMetadata?.(input),
        status: 'error',
        errorCode: error.name,
        errorMessage: error.message,
        durationMs,
      };

      void this.#logStore.writeAudit(event).catch(() => {});
      void this.#logStore.writeError({
        id: ulid(),
        timestamp,
        source: 'use-case',
        operation: this.#config.operation,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        userId: this.#context.userId,
        deviceId: this.#context.deviceId,
        businessId: this.#context.businessId,
        context: this.#config.extractMetadata?.(input),
      }).catch(() => {});

      throw err;
    }
  }
}
