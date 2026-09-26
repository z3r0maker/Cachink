/**
 * SyncEngine — single-flight orchestration of push and pull (A-06).
 *
 * `syncNow()` pushes first (so a sale leaves the phone before anything else)
 * then pulls; concurrent calls share the in-flight run. `pushOnly()` and
 * `capture()` follow a local write: when a run is already in flight they
 * queue ONE trailing run, because the in-flight one may have read the
 * outbox before the write. `capture()` pulls at most every
 * `PULL_AFTER_CAPTURE_MS` — a busy caja must not pull after every sale.
 *
 * At the evening peak (DB2-DEV-02) a failed run starts a jittered
 * exponential backoff, floored by the server's Retry-After; automatic
 * triggers inside it are answered without contacting the server. Triggers
 * (debounce, interval, foreground) live in the UI layer (A-07); this class
 * only runs, reports, and says when to try again (`retryAt`).
 */

import { DrizzleAppConfigRepository, type XangarroDatabase } from '@xangarro/data';
import type { ApiClient } from './api-client.js';
import { RunBackoff, type Random } from './backoff.js';
import { pullAll } from './pull.js';
import { drainPush } from './push.js';
import { readRows } from './row-reader.js';
import { rowKey } from './table-map.js';
import { StatusStore, type RejectedEntry } from './status-store.js';
import {
  NOT_ACTIVATED,
  deferredResult,
  firstError,
  isTransient,
  purgeIfDue,
  type RunMode,
  type RunOptions,
  type SyncRunResult,
} from './sync-run.js';

export type { RunMode, RunOptions, SyncRunResult } from './sync-run.js';

/** After a capture, pull only if the last pull is at least this old. */
export const PULL_AFTER_CAPTURE_MS = 45_000;

export interface SyncEngineDeps {
  readonly db: XangarroDatabase;
  readonly client: ApiClient;
  /** Device token from secure storage; `null` = not activated. */
  readonly getToken: () => Promise<string | null>;
  readonly now?: () => Date;
  /** Injected for tests; spreads backoffs so devices don't retry in step. */
  readonly random?: Random;
}

export interface SyncCounts {
  readonly pending: number;
  readonly rejected: number;
  readonly retrying: number;
}

/** A rejected row plus its current local data (null if the row is gone locally). */
export interface RejectedRow extends RejectedEntry {
  readonly row: Readonly<Record<string, unknown>> | null;
}

const MAX_REJECTED_LISTED = 200;

interface Trailing {
  readonly promise: Promise<SyncRunResult>;
  mode: RunMode;
  manual: boolean;
}

export class SyncEngine {
  readonly #deps: SyncEngineDeps;
  readonly #status: StatusStore;
  readonly #backoff: RunBackoff;
  readonly #now: () => Date;
  #inFlight: Promise<SyncRunResult> | null = null;
  #trailing: Trailing | null = null;
  #lastPullMs: number | null = null;

  constructor(deps: SyncEngineDeps) {
    this.#deps = deps;
    this.#now = deps.now ?? (() => new Date());
    this.#status = new StatusStore(deps.db, { random: deps.random });
    this.#backoff = new RunBackoff(deps.random);
  }

  syncNow(opts: RunOptions = {}): Promise<SyncRunResult> {
    return this.#inFlight ?? this.#launch('both', opts.manual ?? false);
  }

  pushOnly(opts: RunOptions = {}): Promise<SyncRunResult> {
    return this.#afterWrite('push', opts.manual ?? false);
  }

  /** A sale, gasto or cierre was just recorded: push it, pull only if stale. */
  capture(opts: RunOptions = {}): Promise<SyncRunResult> {
    return this.#afterWrite('capture', opts.manual ?? false);
  }

  counts(): Promise<SyncCounts> {
    return this.#status.countByStatus();
  }

  /** Rows the server refused, with their local data for a human summary (A-08). */
  async rejected(): Promise<readonly RejectedRow[]> {
    const entries = await this.#status.listRejected(MAX_REJECTED_LISTED);
    const rows = await readRows(
      this.#deps.db,
      entries.map((e) => ({ tableName: e.tableName, rowId: e.rowId, op: 'insert' as const })),
    );
    return entries.map((e) => ({ ...e, row: rows.get(rowKey(e.tableName, e.rowId)) ?? null }));
  }

  requeue(tableName: string, rowId: string): Promise<void> {
    return this.#status.requeue(tableName, rowId, this.#now());
  }

  #launch(mode: RunMode, manual: boolean): Promise<SyncRunResult> {
    const run = this.#run(mode, manual).finally(() => {
      this.#inFlight = null;
    });
    this.#inFlight = run;
    return run;
  }

  /** One trailing run behind the in-flight one; later writes join it. */
  #afterWrite(mode: RunMode, manual: boolean): Promise<SyncRunResult> {
    const current = this.#inFlight;
    if (current === null) return this.#launch(mode, manual);
    if (this.#trailing !== null) {
      if (mode === 'capture') this.#trailing.mode = 'capture';
      this.#trailing.manual ||= manual;
      return this.#trailing.promise;
    }
    const promise = current
      .catch(() => undefined)
      .then(() => {
        const t = this.#trailing!;
        this.#trailing = null;
        return this.#inFlight ?? this.#launch(t.mode, t.manual);
      });
    this.#trailing = { promise, mode, manual };
    return promise;
  }

  async #run(mode: RunMode, manual: boolean): Promise<SyncRunResult> {
    const token = await this.#deps.getToken();
    if (!token) return NOT_ACTIVATED;
    const blocked = this.#backoff.blockedUntil(this.#now().getTime(), manual);
    if (blocked !== null) return deferredResult(this.#backoff.lastError, blocked);
    const result = await this.#exchange(mode, token);
    const error = result.revoked ? null : firstError(result);
    if (error === null) {
      this.#backoff.succeeded();
      return result;
    }
    const until = this.#backoff.failed(error, this.#now().getTime());
    return { ...result, retryAt: new Date(until).toISOString() };
  }

  async #exchange(mode: RunMode, token: string): Promise<SyncRunResult> {
    const appConfig = new DrizzleAppConfigRepository(this.#deps.db);
    const base = { db: this.#deps.db, appConfig, client: this.#deps.client, token };
    const push = await drainPush({ ...base, now: this.#now });
    if (push.error?.code === 'DEVICE_REVOKED') return { push, pull: null, revoked: true };
    if (!this.#wantsPull(mode) || (push.error !== null && isTransient(push.error)))
      return { push, pull: null, revoked: false };
    const pull = await pullAll(base);
    if (pull.error) return { push, pull, revoked: pull.error.code === 'DEVICE_REVOKED' };
    this.#lastPullMs = this.#now().getTime();
    return { push, pull, revoked: false, purge: await purgeIfDue(this.#deps.db, appConfig) };
  }

  #wantsPull(mode: RunMode): boolean {
    if (mode !== 'capture') return mode === 'both';
    const last = this.#lastPullMs;
    return last === null || this.#now().getTime() - last >= PULL_AFTER_CAPTURE_MS;
  }
}
