/**
 * HttpRemoteLogStore — generic HTTP POST implementation of RemoteLogStore.
 *
 * Ships error batches and bug reports to a configurable endpoint.
 * The specific backend is TBD (Phase E) — this implementation works
 * with any JSON-accepting HTTP endpoint.
 */

import type { ErrorLogEntry } from './error-log.js';
import type { BugReport, RemoteLogStore } from './remote-log-store.js';
import { scrubLogMetadata } from './pii-scrubber.js';

export interface HttpRemoteLogStoreConfig {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly timeoutMs?: number;
}

export class HttpRemoteLogStore implements RemoteLogStore {
  readonly #baseUrl: string;
  readonly #apiKey: string | undefined;
  readonly #timeoutMs: number;

  constructor(config: HttpRemoteLogStoreConfig) {
    this.#baseUrl = config.baseUrl.replace(/\/$/, '');
    this.#apiKey = config.apiKey;
    this.#timeoutMs = config.timeoutMs ?? 10_000;
  }

  async sendErrorBatch(entries: readonly ErrorLogEntry[]): Promise<void> {
    const scrubbed = entries.map((e) => ({
      ...e,
      context: scrubLogMetadata(e.context),
      errorStack: undefined, // Never ship stack traces remotely
    }));

    await this.#post('/errors', { entries: scrubbed });
  }

  async sendBugReport(report: BugReport): Promise<void> {
    await this.#post('/bug-reports', report);
  }

  async #post(path: string, body: unknown): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.#apiKey) headers['Authorization'] = `Bearer ${this.#apiKey}`;

      const response = await fetch(`${this.#baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Remote log store: ${response.status} ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
