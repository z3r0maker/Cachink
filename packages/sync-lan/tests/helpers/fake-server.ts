/**
 * In-memory fake LAN server used by push-queue and pull-loop tests.
 *
 * Stands in for the Rust axum server during unit tests — exposes a
 * `fetch`-compatible callable that matches the ADR-029 contract closely
 * enough for client-side verification. The real conformance test lives
 * in `conflict.test.ts` and exercises the full round-trip against this
 * fake so any protocol drift surfaces immediately.
 */

import {
  API_PATHS,
  API_PREFIX,
  type Delta,
  type PullResponse,
  type PushResponse,
  type RejectedDelta,
  encodeDelta,
  isSyncedTable,
} from '../../src/protocol/index.js';

interface StoredRow {
  table: string;
  rowId: string;
  row: Record<string, unknown>;
  updatedAt: string;
  deviceId: string;
  serverSeq: number;
}

export interface FakeServerOptions {
  initialRows?: Array<{
    table: string;
    row: Record<string, unknown>;
    op: 'insert' | 'update';
  }>;
}

export function createFakeLanServer(options: FakeServerOptions = {}) {
  let lastServerSeq = 0;
  const storage: StoredRow[] = [];
  let pushCallCount = 0;
  let pullCallCount = 0;

  function seedRow(table: string, row: Record<string, unknown>, _op: 'insert' | 'update'): void {
    lastServerSeq += 1;
    storage.push({
      table,
      rowId: String(row['id']),
      row: { ...row },
      updatedAt: String(row['updated_at']),
      deviceId: String(row['device_id']),
      serverSeq: lastServerSeq,
    });
  }

  for (const seed of options.initialRows ?? []) {
    seedRow(seed.table, seed.row, seed.op);
  }

  function tryApply(delta: Delta): 'applied' | 'stale' | 'invalid' {
    if (!isSyncedTable(delta.table)) return 'invalid';
    const existing = storage.find((r) => r.table === delta.table && r.rowId === delta.rowId);
    if (!existing) {
      seedRow(delta.table, delta.row, delta.op);
      return 'applied';
    }
    if (
      delta.rowUpdatedAt > existing.updatedAt ||
      (delta.rowUpdatedAt === existing.updatedAt && delta.rowDeviceId < existing.deviceId)
    ) {
      lastServerSeq += 1;
      existing.row = { ...delta.row };
      existing.updatedAt = delta.rowUpdatedAt;
      existing.deviceId = delta.rowDeviceId;
      existing.serverSeq = lastServerSeq;
      return 'applied';
    }
    return 'stale';
  }

  function handlePush(body: { deltas: Delta[] }): Response {
    pushCallCount += 1;
    let accepted = 0;
    const rejected: RejectedDelta[] = [];
    for (const d of body.deltas) {
      const outcome = tryApply(d);
      if (outcome === 'applied') accepted += 1;
      else rejected.push({ rowId: d.rowId, table: d.table, reason: outcome });
    }
    const response: PushResponse = { accepted, rejected, lastServerSeq };
    return new Response(JSON.stringify(response), { status: 200 });
  }

  function handlePull(url: string): Response {
    pullCallCount += 1;
    const sinceMatch = url.match(/since=(\d+)/);
    const limitMatch = url.match(/limit=(\d+)/);
    const since = sinceMatch ? Number(sinceMatch[1]) : 0;
    const limit = limitMatch ? Math.min(Number(limitMatch[1]), 500) : 500;
    const newer = storage
      .filter((r) => r.serverSeq > since)
      .sort((a, b) => a.serverSeq - b.serverSeq);
    const page = newer.slice(0, limit);
    const deltas = page.map((r) =>
      encodeDelta(r.table as Parameters<typeof encodeDelta>[0], r.row, 'update'),
    );
    const nextSince = page.length > 0 ? page[page.length - 1]!.serverSeq : since;
    const body: PullResponse = {
      deltas,
      nextSince,
      hasMore: newer.length > page.length,
    };
    return new Response(JSON.stringify(body), { status: 200 });
  }

  const fakeFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const method = init?.method ?? 'GET';
    if (url.endsWith(`${API_PREFIX}${API_PATHS.PUSH}`) && method === 'POST') {
      const body = JSON.parse(String(init?.body ?? '{}')) as { deltas: Delta[] };
      return handlePush(body);
    }
    if (url.includes(`${API_PREFIX}${API_PATHS.PULL}`) && method === 'GET') {
      return handlePull(url);
    }
    return new Response(JSON.stringify({ error: 'not found', code: 'server_error' }), {
      status: 404,
    });
  };

  return {
    fetch: fakeFetch,
    storage: () => storage.map((r) => ({ ...r, row: { ...r.row } })),
    pushCallCount: () => pushCallCount,
    pullCallCount: () => pullCallCount,
    lastServerSeq: () => lastServerSeq,
  };
}
