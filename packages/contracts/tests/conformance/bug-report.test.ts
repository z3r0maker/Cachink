import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateResponseSchema, type ActivateResponse } from '../../src/activate.js';
import { ErrorEnvelopeSchema } from '../../src/errors.js';
import { BugReportResponseSchema } from '../../src/support.js';
import { API_PATHS } from '../../src/transport.js';
import { DEVICE, call, startHarness, type Harness } from './setup.js';

/**
 * §9 `POST /support/bug-report` (C-25, N-81), against the mock and the real
 * backend alike: only a linked device may report, and who it is comes from
 * its token.
 */
let h: Harness;
let act: ActivateResponse;
beforeAll(async () => {
  h = await startHarness();
  const r = await call(h.base, 'POST', API_PATHS.activate, {
    body: { email: h.email, code: await h.freshCode(), device: DEVICE },
  });
  act = ActivateResponseSchema.parse(r.body);
});
afterAll(async () => {
  await h.close();
});

const report = (over: Record<string, unknown> = {}) => ({
  description: 'Conformance: la app se cerró al cobrar',
  submittedAt: new Date().toISOString(),
  appVersion: '0.0.0-conformance',
  ...over,
});

describe('conformance: /support/bug-report', () => {
  it('refuses a caller with no device token', async () => {
    const r = await call(h.base, 'POST', API_PATHS.bugReport, { body: report() });
    assert.equal(r.status, 401);
    assert.equal(ErrorEnvelopeSchema.parse(r.body).error.code, 'UNAUTHENTICATED');
  });

  it('refuses a token nobody issued', async () => {
    const r = await call(h.base, 'POST', API_PATHS.bugReport, {
      token: 'not-a-device-token',
      body: report(),
    });
    assert.equal(r.status, 401);
  });

  it('accepts a report from a linked device', async () => {
    const r = await call(h.base, 'POST', API_PATHS.bugReport, {
      token: act.deviceToken,
      body: report({ snapshot: { auditEvents: [{ action: 'venta' }], errors: [] } }),
    });
    assert.equal(r.status, 200);
    assert.deepEqual(BugReportResponseSchema.parse(r.body), { accepted: true });
  });

  it('accepts ids in the body and believes none of them', async () => {
    const r = await call(h.base, 'POST', API_PATHS.bugReport, {
      token: act.deviceToken,
      body: report({ deviceId: 'somebody-else', businessId: 'another-business' }),
    });
    assert.equal(r.status, 200);
  });

  it('refuses a report with nothing in it, as a whole-request VALIDATION', async () => {
    const r = await call(h.base, 'POST', API_PATHS.bugReport, {
      token: act.deviceToken,
      body: report({ description: '   ' }),
    });
    assert.equal(r.status, 400);
    assert.equal(ErrorEnvelopeSchema.parse(r.body).error.code, 'VALIDATION');
  });
});
