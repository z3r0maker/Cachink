/**
 * Public types surfaced by the LAN sync client (Slice 5 C11).
 *
 * Kept separate from the internal implementation so consumers in
 * `@cachink/ui` can import a stable surface without reaching into the
 * push-queue / pull-loop internals.
 */

import type { CachinkDatabase } from '@cachink/data';

export type LanSyncStatus = 'idle' | 'connecting' | 'syncing' | 'online' | 'offline' | 'error';

export interface LanSyncConfig {
  /** Handle to the local SQLite database. Must already be migrated. */
  db: CachinkDatabase;
  /** ULID identifying this device — written onto every delta we push. */
  deviceId: string;
  /** LAN server URL, e.g. `http://192.168.1.5:43812`. */
  serverUrl: string;
  /** Bearer token issued by `/api/v1/pair`. */
  accessToken: string;
  /** Polling cadence for the pull loop. Paused while WS is alive. */
  pullIntervalMs?: number;
  /** Max exponential backoff for WebSocket reconnects. */
  maxBackoffMs?: number;
  /** Injected clock — defaults to `Date.now`. */
  now?: () => number;
  /** Injected fetch — defaults to global fetch. */
  fetch?: typeof fetch;
}

export interface LanSyncStatusSnapshot {
  status: LanSyncStatus;
  lastServerSeq: number;
  connectedDevices: number;
  lastError: string | null;
  retriesInWindow: number;
}

export type StatusListener = (snapshot: LanSyncStatusSnapshot) => void;

export interface LanSyncClient {
  start(): Promise<void>;
  stop(): Promise<void>;
  retryNow(): Promise<void>;
  getStatus(): LanSyncStatusSnapshot;
  addListener(listener: StatusListener): () => void;
}
