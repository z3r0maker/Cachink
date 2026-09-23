import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateResponseSchema } from '../../src/activate.js';
import { API_PATHS } from '../../src/transport.js';
import { DEVICE, call, startHarness, verifyEntitlement, type Harness } from './setup.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
});
afterAll(async () => {
  await h.close();
});

describe('POST /activate', () => {
  it('happy path: valid response, signed entitlement, bootstrap tables', async () => {
    const code = await h.freshCode();
    const r = await call(h.base, 'POST', API_PATHS.activate, {
      body: { email: h.email, code, device: DEVICE },
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const parsed = ActivateResponseSchema.parse(r.body);
    assert.ok(parsed.deviceToken.length > 0);
    assert.equal(await verifyEntitlement(parsed.entitlement), true);
    assert.ok(parsed.bootstrap.tables.users.length >= 1);
    assert.ok(parsed.bootstrap.tables.products.length >= 1);
    for (const u of parsed.bootstrap.tables.users)
      assert.equal('email' in u, false, 'users never carry email');
  });

  it('a code cannot be redeemed twice, even under a concurrent race', async () => {
    const code = await h.freshCode();
    const body = { email: h.email, code, device: DEVICE };
    const [a, b] = await Promise.all([
      call(h.base, 'POST', API_PATHS.activate, { body }),
      call(h.base, 'POST', API_PATHS.activate, { body }),
    ]);
    const statuses = [a.status, b.status].sort();
    assert.deepEqual(statuses, [200, 409], JSON.stringify([a.body, b.body]));
  });

  it('rejects an unknown code, a wrong email, and a malformed body with the contract codes', async () => {
    const bad = await call(h.base, 'POST', API_PATHS.activate, {
      body: { email: h.email, code: 'ZZZZZZZZ', device: DEVICE },
    });
    assert.equal(bad.status, 400);
    assert.equal((bad.body['error'] as { code: string }).code, 'CODE_INVALID');
    const code = await h.freshCode();
    const mismatch = await call(h.base, 'POST', API_PATHS.activate, {
      body: { email: 'other@x.mx', code, device: DEVICE },
    });
    // SEC-DEV-01: a wrong email is the same public answer as an unknown code —
    // the response must never confirm that a code exists.
    assert.equal(mismatch.status, 400, JSON.stringify(mismatch.body));
    assert.equal((mismatch.body['error'] as { code: string }).code, 'CODE_INVALID');
    const malformed = await call(h.base, 'POST', API_PATHS.activate, {
      body: { email: 'nope', code, device: { name: 'x' } },
    });
    assert.equal(malformed.status, 400);
  });

  it('refuses without the protocol header', async () => {
    const res = await fetch(`${h.base}${API_PATHS.activate}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(res.status, 426);
  });
});
