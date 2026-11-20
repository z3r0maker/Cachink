// @vitest-environment node
import assert from 'node:assert/strict';

import { DEV_KEYS } from '@xangarro/contracts/mock';
import { describe, it } from 'vitest';

import { portalServerEnv, TEST_ENTITLEMENT_KEY, TEST_TOTP_KEY } from '../../src/tenant/index.js';

/**
 * The portal server's env, one recipe for Playwright and Synth. These pin it,
 * so a change shows up here and in both callers at once.
 */
const URLS = {
  databaseUrl: 'postgres://app@localhost:1/x',
  superDatabaseUrl: 'postgres://super@localhost:1/x',
  billingDatabaseUrl: 'postgres://billing@localhost:1/x',
};

describe('portalServerEnv', () => {
  it('passes the URLs and the clock through, with the test fallbacks for everything else', () => {
    assert.deepEqual(portalServerEnv({ ...URLS, today: '2026-05-12' }), {
      DATABASE_URL: URLS.databaseUrl,
      DATABASE_SUPER_URL: URLS.superDatabaseUrl,
      BILLING_DATABASE_URL: URLS.billingDatabaseUrl,
      PORTAL_TODAY: '2026-05-12',
      DEV_PAGES: '1',
      DEVICE_TOKEN_SECRET: 'e2e-only-not-a-real-secret',
      ENTITLEMENT_PRIVATE_KEY: DEV_KEYS.privateHex,
      PORTAL_TOTP_KEY: TEST_TOTP_KEY,
      DATABASE_POOL_MAX: '5',
      EXPORTS_PER_TENANT: '1000',
    });
  });

  it('takes a given secret, key or limit over its fallback, and an undefined one as absent', () => {
    const env = portalServerEnv({
      ...URLS,
      today: '2026-11-19',
      deviceTokenSecret: 's',
      entitlementPrivateKey: undefined,
      totpKey: 'k',
      poolMax: '9',
    });
    assert.equal(env.DEVICE_TOKEN_SECRET, 's');
    assert.equal(env.ENTITLEMENT_PRIVATE_KEY, TEST_ENTITLEMENT_KEY);
    assert.equal(env.PORTAL_TOTP_KEY, 'k');
    assert.equal(env.DATABASE_POOL_MAX, '9');
  });

  it('carries no Stripe, Resend, CFDI or LLM key: a test server talks to nothing outside', () => {
    const keys = Object.keys(portalServerEnv({ ...URLS, today: '2026-11-19' }));
    const outside = keys.filter((k) => /STRIPE|RESEND|FACTURAPI|ASESOR_LLM|SENTRY/.test(k));
    assert.deepEqual(outside, []);
  });

  it('uses the plainly-fake TOTP key: 32 zero bytes', () => {
    assert.equal(Buffer.from(TEST_TOTP_KEY, 'base64').length, 32);
    assert.ok(Buffer.from(TEST_TOTP_KEY, 'base64').every((b) => b === 0));
  });
});
