/**
 * WebSocket subscription manager for the LAN sync client (Slice 5 C14).
 *
 * Opens `WS /api/v1/sync/events?token=<bearer>`, forwards `change` and
 * `ping` frames to the orchestrator, and reconnects with exponential
 * backoff (`min(2^n, 60)` s with ±10% jitter) on drop.
 *
 * The subscription is "fire and forget" — it doesn't block `start()`.
 * Consumers should observe status via the orchestrator's status
 * callback; this module only emits structured events.
 */

import { wsEventSchema, type WsEvent } from '../protocol/wire.js';
import { API_PATHS, API_PREFIX } from '../protocol/constants.js';

export type WsConnState = 'connecting' | 'open' | 'closed';

export interface WsSubscriptionDeps {
  serverUrl: string;
  accessToken: string;
  /** Injected WebSocket constructor. Defaults to `globalThis.WebSocket`. */
  createWebSocket?: (url: string) => WebSocket;
  onEvent: (evt: WsEvent) => void;
  onStateChange: (state: WsConnState) => void;
  /** Cap for exponential backoff (seconds). Defaults to 60. */
  maxBackoffSec?: number;
  /** Injected jitter — defaults to `Math.random()` in [0,1). */
  random?: () => number;
  /** Injected timer — defaults to `setTimeout`. */
  schedule?: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
}

export interface WsSubscriptionHandle {
  stop: () => void;
  /** Current attempt count; resets on successful open. */
  attempts: () => number;
  state: () => WsConnState;
}

interface Internals {
  stopped: boolean;
  attempts: number;
  state: WsConnState;
  socket: WebSocket | null;
  deps: WsSubscriptionDeps;
}

function transition(ctx: Internals, next: WsConnState): void {
  if (ctx.state === next) return;
  ctx.state = next;
  ctx.deps.onStateChange(next);
}

function attachSocket(ctx: Internals, socket: WebSocket): void {
  socket.addEventListener('open', () => {
    ctx.attempts = 0;
    transition(ctx, 'open');
  });
  socket.addEventListener('message', (e: MessageEvent) => {
    try {
      const parsed = wsEventSchema.parse(JSON.parse(String(e.data)));
      ctx.deps.onEvent(parsed);
    } catch {
      // Ignore malformed frames — the event channel is best-effort.
    }
  });
  socket.addEventListener('close', () => scheduleReconnect(ctx));
  socket.addEventListener('error', () => scheduleReconnect(ctx));
}

function scheduleReconnect(ctx: Internals): void {
  transition(ctx, 'closed');
  if (ctx.stopped) return;
  ctx.attempts += 1;
  const maxBackoffSec = ctx.deps.maxBackoffSec ?? 60;
  const rand = ctx.deps.random ?? Math.random;
  const scheduler = ctx.deps.schedule ?? ((cb, ms) => setTimeout(cb, ms));
  const capped = Math.min(2 ** Math.min(ctx.attempts, 10), maxBackoffSec);
  const jitterFactor = 0.9 + rand() * 0.2;
  const delayMs = Math.round(capped * 1000 * jitterFactor);
  scheduler(() => connect(ctx), delayMs);
}

function connect(ctx: Internals): void {
  if (ctx.stopped) return;
  transition(ctx, 'connecting');
  const url = buildWsUrl(ctx.deps.serverUrl, ctx.deps.accessToken);
  const create = ctx.deps.createWebSocket ?? ((u) => new WebSocket(u));
  try {
    ctx.socket = create(url);
  } catch {
    scheduleReconnect(ctx);
    return;
  }
  attachSocket(ctx, ctx.socket);
}

export function startWsSubscription(deps: WsSubscriptionDeps): WsSubscriptionHandle {
  const ctx: Internals = {
    stopped: false,
    attempts: 0,
    state: 'closed',
    socket: null,
    deps,
  };
  connect(ctx);
  return {
    stop: () => {
      ctx.stopped = true;
      ctx.socket?.close();
      transition(ctx, 'closed');
    },
    attempts: () => ctx.attempts,
    state: () => ctx.state,
  };
}

function buildWsUrl(serverUrl: string, token: string): string {
  const base = serverUrl.replace(/^http(s?):\/\//i, 'ws$1://');
  return `${base}${API_PREFIX}${API_PATHS.EVENTS}?token=${encodeURIComponent(token)}`;
}
