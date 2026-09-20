// @vitest-environment node
/**
 * Tests for the shared `pairWithLanServer` helper (Slice 9 Phase B1).
 *
 * The helper POSTs to `/api/v1/pair` with the pairing token + device
 * ID and returns a `LanPairSuccess` on 2xx. On non-2xx or fetch
 * failure it throws a `LanPairError` tagged with a `code` the UI can
 * branch on.
 *
 * Mocks the global `fetch` directly — no network IO.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanPairError, pairWithLanServer } from '../../src/sync/lan-pair';

interface FetchCall {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

function mockFetchOnce(response: Response): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? 'GET',
      headers: Object.fromEntries(Object.entries((init?.headers as Record<string, string>) ?? {})),
      body: init?.body ? JSON.parse(init.body as string) : null,
    });
    return response;
  }) as typeof fetch;
  return calls;
}

function okJson(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errJson(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pairWithLanServer', () => {
  it('POSTs to /api/v1/pair with the protocol header and returns the access token on success', async () => {
    const calls = mockFetchOnce(
      okJson({
        accessToken: 'tok_123',
        businessId: 'biz_abc',
        serverId: 'srv_xyz',
      }),
    );
    const result = await pairWithLanServer({
      serverUrl: 'http://192.168.1.5:43812',
      pairingToken: 'pair_token',
      deviceId: 'dev_01',
    });
    expect(result).toEqual({
      serverUrl: 'http://192.168.1.5:43812',
      accessToken: 'tok_123',
      businessId: 'biz_abc',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('http://192.168.1.5:43812/api/v1/pair');
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.headers['X-Cachink-Protocol']).toBe('1');
    expect(calls[0]?.body).toEqual({
      pairingToken: 'pair_token',
      deviceId: 'dev_01',
    });
  });

  it('appends /api/v1/pair correctly when the server URL already ends with a slash', async () => {
    const calls = mockFetchOnce(okJson({ accessToken: 'x', businessId: 'y', serverId: 'z' }));
    await pairWithLanServer({
      serverUrl: 'http://host/',
      pairingToken: 't',
      deviceId: 'd',
    });
    expect(calls[0]?.url).toBe('http://host/api/v1/pair');
  });

  it('throws LanPairError with the wire-level code when the server returns a 4xx with error JSON', async () => {
    mockFetchOnce(errJson(403, { error: 'Token inválido', code: 'token_expired' }));
    await expect(
      pairWithLanServer({
        serverUrl: 'http://host',
        pairingToken: 'bad',
        deviceId: 'd',
      }),
    ).rejects.toMatchObject({
      name: 'LanPairError',
      code: 'token_expired',
      message: 'Token inválido',
      httpStatus: 403,
    });
  });

  it('falls back to a generic code when the error body is not JSON', async () => {
    mockFetchOnce(
      new Response('oops', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    await expect(
      pairWithLanServer({
        serverUrl: 'http://host',
        pairingToken: 't',
        deviceId: 'd',
      }),
    ).rejects.toMatchObject({
      name: 'LanPairError',
      code: 'pair_failed',
      httpStatus: 500,
    });
  });

  it('wraps fetch rejections in a LanPairError with code="network"', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    await expect(
      pairWithLanServer({
        serverUrl: 'http://host',
        pairingToken: 't',
        deviceId: 'd',
      }),
    ).rejects.toMatchObject({
      name: 'LanPairError',
      code: 'network',
      message: 'ECONNREFUSED',
    });
  });
});

describe('LanPairError', () => {
  it('carries the code and optional httpStatus through construction', () => {
    const err = new LanPairError('boom', 'some_code', 418);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('LanPairError');
    expect(err.code).toBe('some_code');
    expect(err.httpStatus).toBe(418);
  });
});
