/**
 * Test mock for @cachink/observability.
 *
 * The observability package hasn't been published yet, so Vite can't
 * resolve it during test runs. This mock provides the minimal surface
 * needed by app-providers.tsx and the observability/ internal modules.
 */

export type AuditEvent = {
  operation: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type AuditOperation = string;

export interface LogStore {
  append(event: AuditEvent): void;
  getAll(): AuditEvent[];
}

export interface AuditedUseCaseConfig {
  readonly operation: AuditOperation;
}

export class AuditedUseCase<TInput, TOutput> {
  constructor(
    private readonly inner: { execute(input: TInput): TOutput },
    private readonly _config: AuditedUseCaseConfig,
  ) {}
  execute(input: TInput): TOutput {
    return this.inner.execute(input);
  }
}

export async function createLogStore(_opts: unknown): Promise<LogStore> {
  const events: AuditEvent[] = [];
  return {
    append(event: AuditEvent) {
      events.push(event);
    },
    getAll() {
      return events;
    },
  };
}
