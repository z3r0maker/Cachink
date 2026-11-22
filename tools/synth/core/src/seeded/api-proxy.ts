import {
  createServer,
  request as forward,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

import { LOCAL_HOSTS } from '../schemas/config';
import { assertLocalUrl } from '../stack/hosts';
import { grantCancel, takes, type NetRule } from './rules';

/**
 * A seeded bug's network rule, on either runner (S-12): the phone's capture
 * app, or a web run's browser (page and Web Worker alike, which route
 * interception cannot see), talks to this proxy instead of the stack, and it
 * passes every request on except the one its rule takes, which it fails,
 * holds, or rewrites. It listens on every interface, because the emulator
 * reaches the host at 10.0.2.2, and forwards only to this machine. The
 * caller's Host goes through unchanged: the portal checks a server action's
 * Origin against it.
 */
export interface ApiProxy {
  readonly port: number;
  close(): Promise<void>;
}

function readBody(rq: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    rq.on('data', (c: Buffer) => chunks.push(c));
    rq.on('end', () => resolve(Buffer.concat(chunks)));
    rq.on('error', reject);
  });
}

/** Sends the request upstream and relays the answer, rewriting it when asked. */
function relay(
  upstream: URL,
  rq: IncomingMessage,
  body: Buffer,
  rs: ServerResponse,
  rewrite: boolean,
): void {
  const out = forward(
    {
      hostname: upstream.hostname,
      port: upstream.port,
      path: rq.url,
      method: rq.method,
      // A body it rewrites has to come back as plain JSON, not compressed.
      headers: rewrite ? { ...rq.headers, 'accept-encoding': 'identity' } : rq.headers,
    },
    (up) => {
      if (!rewrite) {
        rs.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(rs);
        return;
      }
      void readBody(up).then((raw) => {
        const text = JSON.stringify(grantCancel(JSON.parse(raw.toString('utf8'))));
        const { 'content-length': _len, ...headers } = up.headers;
        rs.writeHead(up.statusCode ?? 502, headers);
        rs.end(text);
      });
    },
  );
  out.on('error', () => {
    rs.writeHead(502);
    rs.end();
  });
  out.end(body);
}

export async function startApiProxy(o: {
  readonly upstream: string;
  readonly rule: NetRule;
}): Promise<ApiProxy> {
  assertLocalUrl(o.upstream, LOCAL_HOSTS);
  const upstream = new URL(o.upstream);
  const server = createServer((rq, rs) => {
    void readBody(rq).then(async (body) => {
      const hit = takes(o.rule, {
        method: rq.method ?? 'GET',
        path: rq.url ?? '/',
        headers: rq.headers as Record<string, string>,
      });
      const { effect } = o.rule;
      if (hit && 'status' in effect) {
        rs.writeHead(effect.status, { 'content-type': 'application/json' });
        rs.end(JSON.stringify({ error: 'seeded' }));
        return;
      }
      if (hit && 'delayMs' in effect) await sleep(effect.delayMs);
      relay(upstream, rq, body, rs, hit && 'rewrite' in effect);
    });
  });
  await new Promise<void>((r) => server.listen(0, '0.0.0.0', r));
  return {
    port: (server.address() as AddressInfo).port,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}
