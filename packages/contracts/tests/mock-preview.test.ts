import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { MOCK_DOWN, MockApi } from '../src/mock/handler.js';
import {
  FIXTURE_BUSINESS_NOMBRE,
  FIXTURE_EMAIL,
  FIXTURE_OWNER_NOMBRE,
} from '../src/mock/fixtures.js';
import { MOCK_QR_TOKENS } from '../src/mock/state.js';
import { API_PATHS, PROTOCOL_VERSION } from '../src/transport.js';

/**
 * The mock's `/activate/preview` (N-25) and the scan tokens it seeds for the
 * Maestro flows: each answers what the scan path would, and previewing never
 * spends the token.
 */
const HEADERS = { 'x-xangarro-protocol': String(PROTOCOL_VERSION) };
const DEVICE = { name: 'iPhone', platform: 'ios', appVersion: '1.0.0', osVersion: '18.1' };
const post = (api: MockApi, path: string, body: unknown) =>
  api.handle({ method: 'POST', path, query: {}, headers: HEADERS, body });
const preview = (api: MockApi, qrToken: unknown) =>
  post(api, API_PATHS.activatePreview, { qrToken });
const codeOf = (body: unknown) => (body as { error: { code: string } }).error.code;

describe('mock /activate/preview (N-25)', () => {
  it('names the fixture business and its owner for the seeded valid token', async () => {
    const r = await preview(new MockApi(), MOCK_QR_TOKENS.valid);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, {
      businessName: FIXTURE_BUSINESS_NOMBRE,
      ownerFirstName: FIXTURE_OWNER_NOMBRE,
      ownerEmail: FIXTURE_EMAIL,
    });
  });

  it('leaves the token redeemable, then says CODE_USED once it is', async () => {
    const api = new MockApi();
    await preview(api, MOCK_QR_TOKENS.valid);
    const linked = await post(api, API_PATHS.activate, {
      qrToken: MOCK_QR_TOKENS.valid,
      device: DEVICE,
    });
    assert.equal(linked.status, 200);
    const after = await preview(api, MOCK_QR_TOKENS.valid);
    assert.equal(after.status, 409);
    assert.equal(codeOf(after.body), 'CODE_USED');
  });

  it('answers the seeded used and expired tokens with their own refusals', async () => {
    const api = new MockApi();
    const used = await preview(api, MOCK_QR_TOKENS.used);
    assert.deepEqual([used.status, codeOf(used.body)], [409, 'CODE_USED']);
    const expired = await preview(api, MOCK_QR_TOKENS.expired);
    assert.deepEqual([expired.status, codeOf(expired.body)], [410, 'CODE_EXPIRED']);
  });

  it('refuses an unknown or malformed token as CODE_INVALID', async () => {
    const api = new MockApi();
    const unknown = await preview(api, 'B'.repeat(22));
    assert.deepEqual([unknown.status, codeOf(unknown.body)], [400, 'CODE_INVALID']);
    const malformed = await preview(api, 42);
    assert.deepEqual([malformed.status, codeOf(malformed.body)], [400, 'CODE_INVALID']);
  });

  it('drops the socket while the mock is down, as with no signal', async () => {
    const api = new MockApi();
    api.state.down = true;
    assert.deepEqual(await preview(api, MOCK_QR_TOKENS.valid), MOCK_DOWN);
  });
});
