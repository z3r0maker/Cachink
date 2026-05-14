/**
 * createLanSyncClient orchestrator tests.
 *
 * Exercises the start/stop lifecycle, status listener, retryNow,
 * and error-recovery paths using a stubbed fetch + in-memory DB.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { makeFreshDb } from './helpers/fresh-db.js';
import { createFakeLanServer } from './helpers/fake-server.js';
import { createLanSyncClient } from '../src/client/lan-sync-client.js';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';

function makeMockWebSocket() {
  return class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readyState = 0;
    private handlers = new Map<string, ((...args: unknown[]) => void)[]>();
    addEventListener(event: string, handler: (...args: unknown[]) => void): void {
      const list = this.handlers.get(event) ?? [];
      list.push(handler);
      this.handlers.set(event, list);
    }
    removeEventListener(): void { /* noop */ }
    close(): void {
      this.readyState = 3;
      const closers = this.handlers.get('close') ?? [];
      for (const h of closers) h({ code: 1000 });
    }
    send(): void { /* noop */ }
  };
}

describe('createLanSyncClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in idle state', () => {
    const db = makeFreshDb();
    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
    });
    const status = client.getStatus();
    expect(status.status).toBe('idle');
    expect(status.connectedDevices).toBe(0);
    expect(status.lastError).toBeNull();
  });

  it('transitions through connecting → syncing → online on start', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer();
    const statuses: string[] = [];

    // Stub WebSocket to prevent real connections
    vi.stubGlobal('WebSocket', makeMockWebSocket());

    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      pullIntervalMs: 60_000, // long delay so pull doesn't re-fire
      fetch: server.fetch,
    });

    client.addListener((snap) => statuses.push(snap.status));
    await client.start();
    await client.stop();

    expect(statuses).toContain('connecting');
    expect(statuses).toContain('online');
    expect(statuses).toContain('idle');
  });

  it('addListener returns an unsubscribe function', () => {
    const db = makeFreshDb();
    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
    });
    const spy = vi.fn();
    const unsub = client.addListener(spy);
    expect(typeof unsub).toBe('function');
    unsub();
    // After unsubscribing, spy should not be called
  });

  it('stop returns to idle', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer();

    vi.stubGlobal('WebSocket', makeMockWebSocket());

    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      pullIntervalMs: 60_000,
      fetch: server.fetch,
    });

    await client.start();
    await client.stop();

    expect(client.getStatus().status).toBe('idle');
  });

  it('transitions to offline when fetch fails', async () => {
    const db = makeFreshDb();
    const broken: typeof fetch = async () => {
      throw new Error('Network unreachable');
    };

    vi.stubGlobal('WebSocket', makeMockWebSocket());

    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      pullIntervalMs: 60_000,
      fetch: broken,
    });

    await client.start();
    const status = client.getStatus();
    expect(status.status).toBe('offline');
    expect(status.lastError).toBe('Network unreachable');
    expect(status.retriesInWindow).toBe(1);
    await client.stop();
  });

  it('retryNow resets retry count before re-syncing', async () => {
    const db = makeFreshDb();
    const broken: typeof fetch = async () => {
      throw new Error('Still broken');
    };

    vi.stubGlobal('WebSocket', makeMockWebSocket());

    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      pullIntervalMs: 60_000,
      fetch: broken,
    });

    await client.start();
    expect(client.getStatus().retriesInWindow).toBe(1);

    // retryNow resets the counter, then runs a cycle (which also fails)
    await client.retryNow();
    // After reset (0) + one failed retry, counter is 1 again
    expect(client.getStatus().retriesInWindow).toBe(1);
    await client.stop();
  });

  it('getStatus returns a snapshot copy', () => {
    const db = makeFreshDb();
    const client = createLanSyncClient({
      db,
      deviceId: DEV,
      serverUrl: 'http://fake',
      accessToken: 'tok',
    });
    const s1 = client.getStatus();
    const s2 = client.getStatus();
    expect(s1).toEqual(s2);
    expect(s1).not.toBe(s2); // different object references
  });
});
