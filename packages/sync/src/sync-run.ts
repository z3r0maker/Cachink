/**
 * The pieces of one SyncEngine run that are not orchestration: the result
 * shape, the retention purge after a clean pull (A-11), and which failures
 * mean "the server or the network is struggling" (DB2-DEV-02).
 */

import type { DrizzleAppConfigRepository, XangarroDatabase } from '@xangarro/data';
import type { PullOutcome } from './pull.js';
import type { PushOutcome, SyncError } from './push.js';
import { purgeAcknowledged, type PurgeOutcome } from './retention.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

export interface SyncRunResult {
  readonly push: PushOutcome | null;
  readonly pull: PullOutcome | null;
  /** True when the server says this device is revoked (A-04 returns to activation). */
  readonly revoked: boolean;
  /** Retention purge run after this pull, if one was due (A-11). */
  readonly purge?: PurgeOutcome | null;
  /**
   * True when the engine did not contact the server: an earlier run failed
   * and its backoff (or the server's Retry-After) has not ended. `push`
   * then repeats that failure so the status the UI shows does not change.
   */
  readonly deferred?: boolean;
  /** ISO time of the next automatic attempt after a failure; absent after a clean run. */
  readonly retryAt?: string | null;
}

export type RunMode = 'push' | 'capture' | 'both';

export interface RunOptions {
  /**
   * A person asked (Actualizar, Reintentar envío, back online): skip the
   * engine's own backoff. The server's Retry-After still applies.
   */
  readonly manual?: boolean;
}

export const NOT_ACTIVATED: SyncRunResult = { push: null, pull: null, revoked: false };

const PURGE_EVERY_MS = 86_400_000;

/** After a clean pull: purge once per server day. Anchored on server time only. */
export async function purgeIfDue(
  db: XangarroDatabase,
  appConfig: DrizzleAppConfigRepository,
): Promise<PurgeOutcome | null> {
  const serverTime = await appConfig.get(SYNC_CONFIG_KEYS.lastServerTime);
  if (!serverTime) return null;
  const last = await appConfig.get(SYNC_CONFIG_KEYS.lastPurgeAt);
  if (last && new Date(serverTime).getTime() - new Date(last).getTime() < PURGE_EVERY_MS)
    return null;
  const outcome = await purgeAcknowledged({ db, appConfig });
  await appConfig.set(SYNC_CONFIG_KEYS.lastPurgeAt, serverTime);
  return outcome;
}

/** Offline, hung, rate-limited or a server error: pulling right after only adds load. */
export function isTransient(error: SyncError): boolean {
  return (
    error.code === 'NETWORK' ||
    error.code === 'TIMEOUT' ||
    error.status === 429 ||
    error.status >= 500
  );
}

/** A run that waits: the last failure again, so the status the UI shows stands. */
export function deferredResult(lastError: SyncError | null, untilMs: number): SyncRunResult {
  const push = lastError ? { batches: 0, accepted: 0, rejected: 0, error: lastError } : null;
  return {
    push,
    pull: null,
    revoked: false,
    deferred: true,
    retryAt: new Date(untilMs).toISOString(),
  };
}

export function firstError(result: SyncRunResult): SyncError | null {
  return result.push?.error ?? result.pull?.error ?? null;
}
