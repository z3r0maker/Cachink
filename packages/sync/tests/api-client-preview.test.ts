import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  FIXTURE_BUSINESS_NOMBRE,
  MOCK_QR_TOKENS,
  startMockServer,
  type RunningMock,
} from '@xangarro/contracts/mock';
import { ApiClient } from '../src/api-client.js';

/** `activatePreview` (N-25) against the contracts' mock: the answer, its refusals, no signal. */
let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

describe('ApiClient.activatePreview', () => {
  it('names the business a valid token would link to', async () => {
    const res = await new ApiClient({ baseUrl: mock.url }).activatePreview({
      qrToken: MOCK_QR_TOKENS.valid,
    });
    assert.equal(res.ok ? res.data.businessName : res.code, FIXTURE_BUSINESS_NOMBRE);
  });

  it('maps a used and an expired token to their contract codes', async () => {
    const client = new ApiClient({ baseUrl: mock.url });
    const used = await client.activatePreview({ qrToken: MOCK_QR_TOKENS.used });
    assert.deepEqual(used.ok ? null : [used.status, used.code], [409, 'CODE_USED']);
    const expired = await client.activatePreview({ qrToken: MOCK_QR_TOKENS.expired });
    assert.deepEqual(expired.ok ? null : [expired.status, expired.code], [410, 'CODE_EXPIRED']);
  });

  it('reads a 200 carrying an extra field as BAD_RESPONSE, never passes it on', async () => {
    const body = { businessName: 'X', ownerFirstName: null, ownerEmail: null, businessId: 'b' };
    const fetchImpl = (async () =>
      new Response(JSON.stringify(body), { status: 200 })) as typeof fetch;
    const res = await new ApiClient({ baseUrl: 'http://x', fetchImpl }).activatePreview({
      qrToken: MOCK_QR_TOKENS.valid,
    });
    assert.equal(res.ok ? null : res.code, 'BAD_RESPONSE');
  });

  it('maps no network to NETWORK without throwing', async () => {
    const res = await new ApiClient({ baseUrl: 'http://127.0.0.1:1' }).activatePreview({
      qrToken: MOCK_QR_TOKENS.valid,
    });
    assert.equal(res.ok ? null : res.code, 'NETWORK');
  });
});
