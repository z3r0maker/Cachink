/**
 * SyncEngine — single-flight orchestration of push and pull (A-06).
 *
 * `syncNow()` pushes first (so a sale leaves the phone before anything else)
 * then pulls. Concurrent calls share the in-flight run instead of starting
 * a second one. Triggers (debounce, interval, foreground) live in the UI
 * layer (A-07); this class only runs and reports.
 */

import { DrizzleAppConfigRepository, type CachinkDatabase } from '@xangarro/data';
import type { ApiClient } from './api-client.js';
import { pullAll, type PullOutcome } from './pull.js';
import { drainPush, type PushOutcome } from './push.js';
import { StatusStore } from './status-store.js';

export interface SyncEngineDeps {
  readonly db: CachinkDatabase;
  readonly client: ApiClient;
  /** Device token from secure storage; `null` = not activated. */
  readonly getToken: () => Promise<string | null>;
  readonly now?: () => Date;
}

export interface SyncRunResult {
  readonly push: PushOutcome | null;
  readonly pull: PullOutcome | null;
  /** True when the server says this device is revoked (A-04 returns to activation). */
  readonly revoked: boolean;
}

export interface SyncCounts {
  readonly pending: number;
  readonly rejected: number;
  readonly retrying: number;
}

const NOT_ACTIVATED: SyncRunResult = { push: null, pull: null, revoked: false };

export class SyncEngine {
  readonly #deps: SyncEngineDeps;
  readonly #status: StatusStore;
  #inFlight: Promise<SyncRunResult> | null = null;

  constructor(deps: SyncEngineDeps) {
    this.#deps = deps;
    this.#status = new StatusStore(deps.db);
  }

  syncNow(): Promise<SyncRunResult> {
    this.#inFlight ??= this.#run('both').finally(() => {
      this.#inFlight = null;
    });
    return this.#inFlight;
  }

  pushOnly(): Promise<SyncRunResult> {
    this.#inFlight ??= this.#run('push').finally(() => {
      this.#inFlight = null;
    });
    return this.#inFlight;
  }

  counts(): Promise<SyncCounts> {
    return this.#status.countByStatus();
  }

  requeue(tableName: string, rowId: string): Promise<void> {
    return this.#status.requeue(tableName, rowId, (this.#deps.now ?? (() => new Date()))());
  }

  async #run(mode: 'push' | 'both'): Promise<SyncRunResult> {
    const token = await this.#deps.getToken();
    if (!token) return NOT_ACTIVATED;
    const appConfig = new DrizzleAppConfigRepository(this.#deps.db);
    const now = this.#deps.now ?? (() => new Date());
    const base = { db: this.#deps.db, appConfig, client: this.#deps.client, token };
    const push = await drainPush({ ...base, now });
    if (push.error?.code === 'DEVICE_REVOKED') return { push, pull: null, revoked: true };
    if (mode === 'push') return { push, pull: null, revoked: false };
    const pull = await pullAll(base);
    return { push, pull, revoked: pull.error?.code === 'DEVICE_REVOKED' };
  }
}
