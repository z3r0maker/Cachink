/**
 * OutboxFlusher — reads unshipped error entries from the local SQLite
 * log store, enriches them with device context + feature flags, and
 * POSTs batches to the remote Edge Function.
 *
 * Consent-gated: no-ops if consent !== true.
 * Flush triggers: cold-start + AppState foreground (lifecycle hooks).
 * Failed flushes simply retry on next lifecycle event — no NetInfo dep.
 */

import type { ErrorLogEntry } from './error-log.js';
import type { LogStore } from './log-store.js';
import type { RemoteLogStore } from './remote-log-store.js';
import type { DeviceContext } from './device-context.js';
import { scrubLogMetadata } from './pii-scrubber.js';

export interface OutboxFlusherConfig {
  readonly logStore: LogStore;
  readonly remote: RemoteLogStore;
  readonly deviceContext: DeviceContext;
  readonly getFeatureFlags: () => Record<string, boolean> | null;
  readonly getConsent: () => boolean | null;
  readonly batchSize?: number;
}

export class OutboxFlusher {
  readonly #logStore: LogStore;
  readonly #remote: RemoteLogStore;
  readonly #deviceContext: DeviceContext;
  readonly #getFeatureFlags: () => Record<string, boolean> | null;
  readonly #getConsent: () => boolean | null;
  readonly #batchSize: number;
  #flushing = false;

  constructor(config: OutboxFlusherConfig) {
    this.#logStore = config.logStore;
    this.#remote = config.remote;
    this.#deviceContext = config.deviceContext;
    this.#getFeatureFlags = config.getFeatureFlags;
    this.#getConsent = config.getConsent;
    this.#batchSize = config.batchSize ?? 50;
  }

  /**
   * Flush unshipped errors to the remote backend.
   * Returns the number of entries shipped, or 0 if skipped/empty.
   */
  async flush(): Promise<number> {
    // Consent gate
    if (this.#getConsent() !== true) return 0;

    // Re-entrance guard
    if (this.#flushing) return 0;
    this.#flushing = true;

    try {
      // Check if the store supports outbox queries
      if (!this.#logStore.queryUnshippedErrors || !this.#logStore.markShipped) {
        return 0;
      }

      const unshipped = await this.#logStore.queryUnshippedErrors(this.#batchSize);
      if (unshipped.length === 0) return 0;

      // Enrich entries with device context
      const enriched = unshipped.map((entry) => this.#enrichEntry(entry));

      // Ship batch
      await this.#remote.sendErrorBatch(enriched);

      // Mark as shipped
      const ids = unshipped.map((e) => e.id).filter(Boolean);
      await this.#logStore.markShipped(ids);

      return unshipped.length;
    } catch {
      // Flush failure is non-critical — will retry on next lifecycle event
      return 0;
    } finally {
      this.#flushing = false;
    }
  }

  #enrichEntry(entry: ErrorLogEntry): ErrorLogEntry {
    const featureFlags = this.#getFeatureFlags();
    const dc = this.#deviceContext;
    return {
      ...entry,
      context: {
        ...scrubLogMetadata(entry.context),
        errorStack: undefined, // Never ship stack traces
        deviceModel: dc.model,
        osName: dc.osName,
        osVersion: dc.osVersion,
        appVersion: dc.appVersion,
        platform: dc.platform,
        ...(featureFlags ? { featureFlags } : {}),
      },
    };
  }
}
