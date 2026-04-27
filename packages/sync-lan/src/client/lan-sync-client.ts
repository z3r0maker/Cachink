/**
 * LanSyncClient — the user-facing orchestrator.
 *
 * Wires push + pull + WebSocket together, exposes a status listener API
 * for `@cachink/ui/sync/lan-bridge.ts`, and handles `retryNow()` for the
 * "SIN CONEXIÓN · REINTENTANDO" SyncStatusBadge variant (Slice 5 C18).
 */

import type {
  LanSyncClient,
  LanSyncConfig,
  LanSyncStatus,
  LanSyncStatusSnapshot,
  StatusListener,
} from './types.js';
import { drainPushQueue } from './push-queue.js';
import { runPullCycle } from './pull-loop.js';
import { startWsSubscription, type WsSubscriptionHandle } from './ws-subscription.js';

const DEFAULT_PULL_INTERVAL_MS = 2000;

interface ClientInternals {
  state: LanSyncStatusSnapshot;
  listeners: Set<StatusListener>;
  config: LanSyncConfig;
  running: boolean;
  pullTimer: ReturnType<typeof setTimeout> | null;
  ws: WsSubscriptionHandle | null;
}

function emit(ctx: ClientInternals): void {
  const snapshot = { ...ctx.state };
  for (const listener of ctx.listeners) listener(snapshot);
}

function setStatus(ctx: ClientInternals, next: LanSyncStatus, err: string | null = null): void {
  if (ctx.state.status === next && ctx.state.lastError === err) return;
  ctx.state.status = next;
  ctx.state.lastError = err;
  emit(ctx);
}

async function runCycle(ctx: ClientInternals): Promise<void> {
  if (!ctx.running) return;
  setStatus(ctx, 'syncing');
  const deps = {
    db: ctx.config.db,
    serverUrl: ctx.config.serverUrl,
    accessToken: ctx.config.accessToken,
    fetchImpl: ctx.config.fetch,
  };
  try {
    const pushed = await drainPushQueue(deps);
    const pulled = await runPullCycle(deps);
    ctx.state.lastServerSeq = Math.max(
      ctx.state.lastServerSeq,
      pushed.lastServerSeq,
      pulled.lastServerSeq,
    );
    setStatus(ctx, 'online');
  } catch (error) {
    ctx.state.retriesInWindow += 1;
    setStatus(ctx, 'offline', messageFrom(error));
  }
}

function scheduleNextPull(ctx: ClientInternals): void {
  if (!ctx.running) return;
  const wait = ctx.config.pullIntervalMs ?? DEFAULT_PULL_INTERVAL_MS;
  ctx.pullTimer = setTimeout(() => {
    void runCycle(ctx).finally(() => scheduleNextPull(ctx));
  }, wait);
}

function startWsFor(ctx: ClientInternals): WsSubscriptionHandle {
  return startWsSubscription({
    serverUrl: ctx.config.serverUrl,
    accessToken: ctx.config.accessToken,
    onEvent: (evt) => {
      if (evt.type === 'change') {
        void runCycle(ctx);
      }
    },
    onStateChange: (wsState) => {
      if (wsState === 'open') ctx.state.connectedDevices = 1;
      else if (wsState === 'closed') ctx.state.connectedDevices = 0;
      emit(ctx);
    },
    maxBackoffSec: (ctx.config.maxBackoffMs ?? 60_000) / 1000,
  });
}

function makeInitialCtx(config: LanSyncConfig): ClientInternals {
  return {
    state: {
      status: 'idle',
      lastServerSeq: 0,
      connectedDevices: 0,
      lastError: null,
      retriesInWindow: 0,
    },
    listeners: new Set(),
    config,
    running: false,
    pullTimer: null,
    ws: null,
  };
}

async function startClient(ctx: ClientInternals): Promise<void> {
  if (ctx.running) return;
  ctx.running = true;
  setStatus(ctx, 'connecting');
  await runCycle(ctx);
  scheduleNextPull(ctx);
  ctx.ws = startWsFor(ctx);
}

async function stopClient(ctx: ClientInternals): Promise<void> {
  ctx.running = false;
  if (ctx.pullTimer) clearTimeout(ctx.pullTimer);
  ctx.pullTimer = null;
  ctx.ws?.stop();
  ctx.ws = null;
  setStatus(ctx, 'idle');
}

export function createLanSyncClient(config: LanSyncConfig): LanSyncClient {
  const ctx = makeInitialCtx(config);
  return {
    start: () => startClient(ctx),
    stop: () => stopClient(ctx),
    retryNow: async () => {
      ctx.state.retriesInWindow = 0;
      await runCycle(ctx);
    },
    getStatus: () => ({ ...ctx.state }),
    addListener: (listener) => {
      ctx.listeners.add(listener);
      return () => ctx.listeners.delete(listener);
    },
  };
}

function messageFrom(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'unknown');
}
