import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateResponseSchema } from '../../src/activate.js';
import { API_PATHS } from '../../src/transport.js';
import { DEVICE, call, startHarness, verifyEntitlement, type Harness } from './setup.js';

/**
 * The scan path of `POST /activate` (C-14). Its own file, so it starts from a
 * fresh tenant: against a real server `conformance.sh` mints per file and
 * frees the conformance tenant's device slots; against the mock each file
 * boots its own server.
 */
let h: Harness;
beforeAll(async () => {
  h = await startHarness();
});
afterAll(async () => {
  await h.close();
});

describe('POST /activate — scan path (C-14)', () => {
  it('scan path: a pairing token alone activates, once, even under a race (C-14)', async () => {
    const qrToken = await h.freshQrToken();
    const [a, b] = await Promise.all([
      call(h.base, 'POST', API_PATHS.activate, { body: { qrToken, device: DEVICE } }),
      call(h.base, 'POST', API_PATHS.activate, { body: { qrToken, device: DEVICE } }),
    ]);
    const ok = [a, b].find((r) => r.status === 200);
    assert.deepEqual([a.status, b.status].sort(), [200, 409], JSON.stringify([a.body, b.body]));
    const parsed = ActivateResponseSchema.parse(ok?.body);
    assert.equal(await verifyEntitlement(parsed.entitlement), true);
  });

  it('scan path: an unknown token is CODE_INVALID', async () => {
    const r = await call(h.base, 'POST', API_PATHS.activate, {
      body: { qrToken: 'A'.repeat(22), device: DEVICE },
    });
    assert.equal(r.status, 400);
    assert.equal((r.body['error'] as { code: string }).code, 'CODE_INVALID');
  });

  it('scan path: an expired token is CODE_EXPIRED (mock; the DB suite covers the server)', async () => {
    if (!h.isMock) return;
    const qrToken = await h.freshQrToken({ expired: true });
    const r = await call(h.base, 'POST', API_PATHS.activate, { body: { qrToken, device: DEVICE } });
    assert.equal(r.status, 410);
    assert.equal((r.body['error'] as { code: string }).code, 'CODE_EXPIRED');
  });
});
