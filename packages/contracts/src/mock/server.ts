/**
 * Node http wrapper + msw adapter around `MockApi`.
 *   pnpm mock:api            → standalone on :3000 (simulator / manual curl)
 *   mswHandlers(api, base)   → in-process interception for unit tests
 */

import { createServer, type IncomingMessage, type Server } from 'node:http';
import { http, HttpResponse } from 'msw';
import { MockApi, type MockRequest } from './handler.js';

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? (JSON.parse(text) as unknown) : undefined;
}

function toMockRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: unknown,
): MockRequest {
  return { method, path: url.pathname, query: Object.fromEntries(url.searchParams), headers, body };
}

export interface RunningMock {
  readonly url: string;
  readonly api: MockApi;
  close(): Promise<void>;
}

export function startMockServer(port = 0, api = new MockApi()): Promise<RunningMock> {
  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers))
      if (typeof v === 'string') headers[k.toLowerCase()] = v;
    let out;
    try {
      out = await api.handle(toMockRequest(req.method ?? 'GET', url, headers, await readBody(req)));
    } catch (e) {
      out = {
        status: 500,
        body: { error: { code: 'INTERNAL', message: e instanceof Error ? e.message : String(e) } },
      };
    }
    res.writeHead(out.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out.body));
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const p = typeof addr === 'object' && addr ? addr.port : port;
      resolve({
        url: `http://127.0.0.1:${p}`,
        api,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

/** msw request handlers delegating to the same `MockApi` (for vitest with `setupServer`). */
export function mswHandlers(api: MockApi, base = 'http://localhost:3000') {
  return [
    http.all(`${base}/*`, async ({ request }) => {
      const url = new URL(request.url);
      const headers: Record<string, string> = {};
      request.headers.forEach((v, k) => {
        headers[k.toLowerCase()] = v;
      });
      const text = await request.text();
      const body = text ? (JSON.parse(text) as unknown) : undefined;
      const out = await api.handle(toMockRequest(request.method, url, headers, body));
      return HttpResponse.json(out.body as Record<string, unknown>, { status: out.status });
    }),
  ];
}
