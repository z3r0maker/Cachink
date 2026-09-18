/**
 * A scripted `fetch` for adapter tests: records every request and answers
 * from a queue. No network, no credentials.
 */

import type { HttpFetch, HttpRequestInit, HttpResponse } from '../../../src/cfdi/index.js';

export interface RecordedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

type Scripted = HttpResponse | Error;

export function jsonResponse(status: number, body: unknown): HttpResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
  };
}

export function binaryResponse(text: string): HttpResponse {
  return {
    status: 200,
    ok: true,
    json: async () => {
      throw new SyntaxError('not json');
    },
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
}

export class FakeHttp {
  readonly requests: RecordedRequest[] = [];
  readonly #queue: Scripted[] = [];

  reply(...responses: Scripted[]): this {
    this.#queue.push(...responses);
    return this;
  }

  readonly fetch: HttpFetch = async (url: string, init: HttpRequestInit) => {
    this.requests.push({
      url,
      method: init.method,
      headers: init.headers,
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    });
    const next = this.#queue.shift();
    if (!next) throw new Error(`Unscripted request ${init.method} ${url}`);
    if (next instanceof Error) throw next;
    return next;
  };

  get last(): RecordedRequest {
    const last = this.requests.at(-1);
    if (!last) throw new Error('no requests');
    return last;
  }
}

/** A stamped invoice as Facturapi returns it (trimmed to the fields we read). */
export function facturapiInvoice(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'inv_65f1',
    uuid: '39c85a3f-275b-4341-b259-e8971d9f8a94',
    status: 'valid',
    total: 199,
    date: '2026-09-15T18:00:05.000Z',
    stamp: { date: '2026-09-15T18:00:06' },
    cancellation_status: 'none',
    ...overrides,
  };
}
