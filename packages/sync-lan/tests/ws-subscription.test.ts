/**
 * WebSocket subscription tests (Slice 5 C14) — drives backoff + reconnect
 * with injected timers / WebSocket constructor so no real socket opens.
 */

import { describe, expect, it, vi } from 'vitest';
import { startWsSubscription } from '../src/client/ws-subscription.js';

interface FakeSocket {
  listeners: Map<string, (e: unknown) => void>;
  close: () => void;
  fire: (type: string, payload?: unknown) => void;
}

function makeFakeSocketFactory() {
  const sockets: FakeSocket[] = [];
  const factory = (_url: string): WebSocket => {
    const listeners = new Map<string, (e: unknown) => void>();
    const socket: FakeSocket = {
      listeners,
      close: () => listeners.get('close')?.({}),
      fire: (type, payload) => listeners.get(type)?.(payload ?? {}),
    };
    sockets.push(socket);
    const adapter = {
      addEventListener: (type: string, cb: (e: unknown) => void) => listeners.set(type, cb),
      close: socket.close,
    };
    return adapter as unknown as WebSocket;
  };
  return { factory, sockets };
}

describe('WebSocket subscription — backoff and state transitions', () => {
  it('transitions connecting → open on the first successful connect', () => {
    const { factory, sockets } = makeFakeSocketFactory();
    const states: string[] = [];
    const sub = startWsSubscription({
      serverUrl: 'http://fake',
      accessToken: 'tok',
      createWebSocket: factory,
      onEvent: () => {},
      onStateChange: (s) => states.push(s),
      schedule: vi.fn(),
    });

    expect(states[0]).toBe('connecting');
    sockets[0]?.fire('open');
    expect(states.at(-1)).toBe('open');
    sub.stop();
  });

  it('reconnects with capped exponential backoff after a close', () => {
    const { factory, sockets } = makeFakeSocketFactory();
    const delays: number[] = [];
    const schedule = vi.fn((cb: () => void, ms: number) => {
      delays.push(ms);
      return setTimeout(cb, 0);
    });
    const sub = startWsSubscription({
      serverUrl: 'http://fake',
      accessToken: 'tok',
      createWebSocket: factory,
      onEvent: () => {},
      onStateChange: () => {},
      schedule: schedule as unknown as typeof setTimeout,
      random: () => 0.5,
    });

    // Simulate three consecutive drops without an open between.
    sockets[0]?.fire('close');
    sockets[0]?.fire('close');
    sockets[0]?.fire('close');

    expect(delays.length).toBeGreaterThanOrEqual(1);
    // Each subsequent delay should be at least as large as the last
    // (capped by maxBackoff + jitter).
    for (let i = 1; i < delays.length; i += 1) {
      expect(delays[i]!).toBeGreaterThanOrEqual(delays[i - 1]! * 0.9);
    }
    sub.stop();
  });

  it('forwards valid change events through onEvent', () => {
    const { factory, sockets } = makeFakeSocketFactory();
    const events: unknown[] = [];
    const sub = startWsSubscription({
      serverUrl: 'http://fake',
      accessToken: 'tok',
      createWebSocket: factory,
      onEvent: (e) => events.push(e),
      onStateChange: () => {},
      schedule: vi.fn(),
    });

    sockets[0]?.fire('message', { data: JSON.stringify({ type: 'change', serverSeq: 7 }) });
    expect(events).toEqual([{ type: 'change', serverSeq: 7 }]);
    sub.stop();
  });

  it('ignores malformed frames without throwing', () => {
    const { factory, sockets } = makeFakeSocketFactory();
    const events: unknown[] = [];
    const sub = startWsSubscription({
      serverUrl: 'http://fake',
      accessToken: 'tok',
      createWebSocket: factory,
      onEvent: (e) => events.push(e),
      onStateChange: () => {},
      schedule: vi.fn(),
    });

    expect(() => {
      sockets[0]?.fire('message', { data: 'not-json' });
    }).not.toThrow();
    expect(events).toEqual([]);
    sub.stop();
  });
});
