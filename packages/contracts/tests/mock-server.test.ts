import { afterAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { MockApi, MockRequest, MockResponse } from '../src/mock/handler.js';
import { startMockServer, type RunningMock } from '../src/mock/server.js';

/**
 * The Node wrapper's own edges, which only real HTTP exercises: a POST with
 * no body at all (control routes take it), and a handler that throws — the
 * wrapper answers INTERNAL with the message, in JSON, not a hung socket.
 */

let corriendo: RunningMock | null = null;
afterAll(async () => {
  await corriendo?.close();
});

describe('the http wrapper', () => {
  it('while down, a contract call fails as the network would, and the controls still answer', async () => {
    const caido = await startMockServer();
    try {
      const abajo = await fetch(`${caido.url}/__mock/down`, { method: 'POST' });
      assert.equal(abajo.status, 200);
      // No HTTP status at all: the socket is dropped, which the phone's
      // ApiClient reads as NETWORK — exactly what airplane mode produces.
      await assert.rejects(
        fetch(`${caido.url}/api/v1/sync/pull?since=0`, {
          headers: { 'X-Xangarro-Protocol': '1' },
        }),
        TypeError,
      );
      const arriba = await fetch(`${caido.url}/__mock/up`, { method: 'POST' });
      assert.deepEqual(await arriba.json(), { down: false });
      const r = await fetch(`${caido.url}/api/v1/sync/pull?since=0`);
      assert.equal(r.status, 426);
    } finally {
      await caido.close();
    }
  });

  it('takes a POST with no body, as curl would send it to /__mock/reset', async () => {
    corriendo = await startMockServer();
    const r = await fetch(`${corriendo.url}/__mock/reset`, { method: 'POST' });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  });

  it('a handler that throws answers INTERNAL with the message, for an Error and for junk', async () => {
    const lanza = (valor: unknown) =>
      ({
        state: corriendo?.state,
        handle: async (_req: MockRequest): Promise<MockResponse> => {
          throw valor;
        },
      }) as unknown as MockApi;
    const conError = await startMockServer(0, lanza(new Error('boom')));
    try {
      const r = await fetch(`${conError.url}/api/v1/activate`, { method: 'POST' });
      assert.equal(r.status, 500);
      const body = (await r.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, 'INTERNAL');
      assert.equal(body.error.message, 'boom');
    } finally {
      await conError.close();
    }

    const conCualquier = await startMockServer(0, lanza('un string'));
    try {
      const r = await fetch(`${conCualquier.url}/api/v1/activate`, { method: 'POST' });
      assert.equal(r.status, 500);
      const body = (await r.json()) as { error: { message: string } };
      assert.equal(body.error.message, 'un string');
    } finally {
      await conCualquier.close();
    }
  });
});
