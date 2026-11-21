import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivatePreviewResponseSchema } from '../../src/activate-preview.js';
import { ActivateResponseSchema } from '../../src/activate.js';
import { API_PATHS } from '../../src/transport.js';
import { DEVICE, call, startHarness, type Harness } from './setup.js';

/**
 * `POST /activate/preview` (N-25, SEC-MOB-04): the business a scanned token
 * would link to, consuming nothing. Its own file, so against a real server it
 * gets its own minted tokens (`conformance.sh`).
 */
let h: Harness;
beforeAll(async () => {
  h = await startHarness();
});
afterAll(async () => {
  await h.close();
});

const preview = (qrToken: unknown) =>
  call(h.base, 'POST', API_PATHS.activatePreview, { body: { qrToken } });
const codeOf = (body: Record<string, unknown>) => (body['error'] as { code: string }).code;

describe('POST /activate/preview (N-25)', () => {
  it('names the business and its owner, and nothing else', async () => {
    const r = await preview(await h.freshQrToken());
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const parsed = ActivatePreviewResponseSchema.parse(r.body);
    assert.deepEqual(Object.keys(r.body).sort(), ['businessName', 'ownerEmail', 'ownerFirstName']);
    assert.ok(parsed.businessName.length > 0);
  });

  it('consumes nothing: the token still redeems, twice previewed, then answers CODE_USED', async () => {
    const qrToken = await h.freshQrToken();
    assert.equal((await preview(qrToken)).status, 200);
    assert.equal((await preview(qrToken)).status, 200);
    const linked = await call(h.base, 'POST', API_PATHS.activate, {
      body: { qrToken, device: DEVICE },
    });
    assert.equal(linked.status, 200, JSON.stringify(linked.body));
    ActivateResponseSchema.parse(linked.body);
    const after = await preview(qrToken);
    assert.equal(after.status, 409);
    assert.equal(codeOf(after.body), 'CODE_USED');
  });

  it('an unknown token is CODE_INVALID, and so is one the contract rejects', async () => {
    const unknown = await preview('A'.repeat(22));
    assert.equal(unknown.status, 400);
    assert.equal(codeOf(unknown.body), 'CODE_INVALID');
    const malformed = await preview('not a token');
    assert.equal(malformed.status, 400);
    assert.equal(codeOf(malformed.body), 'CODE_INVALID');
  });

  it('an expired token is CODE_EXPIRED (mock; the DB suite covers the server)', async () => {
    if (!h.isMock) return;
    const r = await preview(await h.freshQrToken({ expired: true }));
    assert.equal(r.status, 410);
    assert.equal(codeOf(r.body), 'CODE_EXPIRED');
  });
});
