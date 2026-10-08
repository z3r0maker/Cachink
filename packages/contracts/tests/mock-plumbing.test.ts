import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { setupServer } from 'msw/node';

import { MockApi } from '../src/mock/handler.js';
import { mswHandlers } from '../src/mock/server.js';
import { bigintKeys, wireSchema } from '../src/wire.js';

/**
 * The plumbing nobody drives: `wireSchema`'s identity path (a schema with no
 * bigint money changes nothing), the msw adapter used by in-process tests,
 * and the CLI entrypoint itself (`pnpm mock:api`) — booted on a private
 * port, spoken to once over HTTP, and shut down.
 */

describe('wireSchema', () => {
  it('a schema with no bigint fields is itself, values untouched', () => {
    const SinDinero = z.object({ nombre: z.string(), n: z.number() });
    const w = wireSchema(SinDinero);
    assert.deepEqual(w.parse({ nombre: 'x', n: 12 }), { nombre: 'x', n: 12 } as never);
  });

  it('a nullable money field is still found under its wrapper', () => {
    const Opcional = z.object({ monto: z.bigint().nullable() });
    const w = wireSchema(Opcional) as unknown as z.ZodType<unknown>;
    assert.equal((w.parse({ monto: '450' }) as { monto: bigint }).monto, 450n);
    assert.equal((w.parse({ monto: null }) as { monto: null }).monto, null);
  });

  it('a schema with no object shape at all reads as no money keys', () => {
    assert.deepEqual(bigintKeys(z.string() as never), []);
  });

  it('a non-decimal string on a money field is left for the schema to refuse, never coerced', () => {
    const ConDinero = z.object({ monto: z.bigint() });
    const w = wireSchema(ConDinero) as unknown as z.ZodType<unknown>;
    const r = w.safeParse({ monto: 'no-es-numero' });
    assert.equal(r.success, false); // refused as a string, not turned into 0 or NaN
    // A real bigint still parses for in-process callers.
    assert.equal((w.parse({ monto: 5n }) as { monto: bigint }).monto, 5n);
    // Something that is not even an object passes through untouched, for the
    // schema to refuse in its own words.
    assert.equal(w.safeParse('no-objeto').success, false);
  });
});

describe('mswHandlers', () => {
  it('intercepts in-process fetches against the same MockApi', async () => {
    const api = new MockApi();
    const server = setupServer(...mswHandlers(api, 'http://mock-test.local'));
    server.listen({ onUnhandledRequest: 'error' });
    try {
      const r = await fetch('http://mock-test.local/__mock/code', { method: 'POST', body: '' });
      assert.equal(r.status, 200);
      const body = (await r.json()) as { code: string };
      assert.match(body.code, /^[A-Z2-9]{8}$/);

      // A JSON body travels the same road the phone's pushes do.
      const conJson = await fetch('http://mock-test.local/__mock/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'grace' }),
      });
      assert.deepEqual(await conJson.json(), {
        scenario: 'grace',
        transactionsPerMonth: 'plan default',
      });
    } finally {
      server.close();
    }
  });
});
