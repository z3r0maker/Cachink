import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { afterEach, describe, it, vi } from 'vitest';
import { DEV_KEYS as devKeys } from '@xangarro/contracts/mock';

import { generateEntitlementKeypair } from '../scripts/entitlement-keygen';
import { cronAuth, handleCron } from '../src/server/cron';
import {
  assertCredentialsConfigured,
  deviceTokenSecret,
  signEntitlement,
} from '../src/server/device/credentials';
import {
  assertSecretPolicy,
  SecretPolicyError,
  secretProblem,
} from '../src/server/device/secret-policy';

/**
 * What a signing secret must look like in production (audit F-06, SEC-SEC-02):
 * long enough, and never one of the values this repository publishes. Gated on
 * `VERCEL_ENV=production`, so CI and the conformance run — `NODE_ENV=production`
 * with the dev keys, on purpose — are left exactly as they were.
 */
const PRODUCTION = { VERCEL_ENV: 'production' } as const;
/** What the docs generate: `openssl rand -base64 32`, 44 characters. */
const real = () => randomBytes(32).toString('base64');
const PUBLISHED = [
  'dev-only-not-a-real-secret',
  'ci-only-not-a-real-secret',
  'ci-only-not-a-real-secret-device-token',
  'e2e-only-not-a-real-secret',
  'cron-only-not-a-real-secret',
  'conformance-only',
  'conformance-only-padded-to-be-long-enough-0000',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('secretProblem', () => {
  it('says nothing outside production, whatever the value: dev, CI and conformance start', () => {
    for (const env of [{}, { NODE_ENV: 'production' }, { VERCEL_ENV: 'preview' }]) {
      for (const value of [...PUBLISHED, 'x']) {
        assert.equal(secretProblem('DEVICE_TOKEN_SECRET', value, env), null);
        assert.equal(secretProblem('CRON_SECRET', value, env), null);
      }
      assert.equal(secretProblem('ENTITLEMENT_PRIVATE_KEY', devKeys.privateHex, env), null);
    }
  });

  it('in production, refuses a shared secret shorter than 32 characters', () => {
    for (const name of [
      'DEVICE_TOKEN_SECRET',
      'DEVICE_TOKEN_SECRET_PREVIOUS',
      'CRON_SECRET',
    ] as const) {
      assert.equal(secretProblem(name, real().slice(0, 31), PRODUCTION), 'MIN_LENGTH');
      assert.equal(secretProblem(name, real().slice(0, 32), PRODUCTION), null);
    }
  });

  it('in production, refuses every value the repository publishes, however long', () => {
    for (const value of PUBLISHED) {
      assert.equal(secretProblem('DEVICE_TOKEN_SECRET', value, PRODUCTION), 'PUBLISHED_VALUE');
      assert.equal(secretProblem('CRON_SECRET', value, PRODUCTION), 'PUBLISHED_VALUE');
    }
  });

  it('in production, passes what the docs generate', async () => {
    assert.equal(secretProblem('DEVICE_TOKEN_SECRET', real(), PRODUCTION), null);
    assert.equal(secretProblem('CRON_SECRET', real(), PRODUCTION), null);
    const { privateHex } = await generateEntitlementKeypair();
    assert.equal(secretProblem('ENTITLEMENT_PRIVATE_KEY', privateHex, PRODUCTION), null);
  });

  it('in production, the entitlement key is 64 hex and not the published test vector', () => {
    const check = (v: string) => secretProblem('ENTITLEMENT_PRIVATE_KEY', v, PRODUCTION);
    assert.equal(check('abc123'), 'ED25519_HEX');
    assert.equal(check(real()), 'ED25519_HEX');
    assert.equal(check(`${devKeys.privateHex}00`), 'ED25519_HEX');
    assert.equal(check(devKeys.privateHex), 'PUBLISHED_VALUE');
    assert.equal(check(devKeys.privateHex.toUpperCase()), 'PUBLISHED_VALUE');
  });

  it('the error names the variable and the rule, and never the value', () => {
    const value = `${real()}-do-not-print`;
    const error = new SecretPolicyError('DEVICE_TOKEN_SECRET', 'MIN_LENGTH');
    assert.equal(error.code, 'SECRET_POLICY');
    assert.match(error.message, /DEVICE_TOKEN_SECRET/);
    assert.match(error.message, /at least 32 characters/);
    assert.throws(
      () => assertSecretPolicy('CRON_SECRET', 'dev-only-not-a-real-secret', PRODUCTION),
      (e: unknown) =>
        e instanceof SecretPolicyError &&
        e.variable === 'CRON_SECRET' &&
        e.rule === 'PUBLISHED_VALUE' &&
        !e.message.includes('dev-only-not-a-real-secret') &&
        !e.message.includes(value),
    );
  });
});

describe('device credentials under the policy', () => {
  it('outside production the dev values still sign, as before', async () => {
    vi.stubEnv('DEVICE_TOKEN_SECRET', 'conformance-only');
    vi.stubEnv('ENTITLEMENT_PRIVATE_KEY', devKeys.privateHex);
    vi.stubEnv('NODE_ENV', 'production');
    assertCredentialsConfigured();
    assert.equal(deviceTokenSecret().length, 'conformance-only'.length);
  });

  it('in production a published or short device secret is an error before anything is signed', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('ENTITLEMENT_PRIVATE_KEY', 'a'.repeat(64));
    vi.stubEnv('DEVICE_TOKEN_SECRET', 'e2e-only-not-a-real-secret');
    const refused = (rule: string) => (e: unknown) =>
      e instanceof SecretPolicyError && e.variable === 'DEVICE_TOKEN_SECRET' && e.rule === rule;
    assert.throws(() => deviceTokenSecret(), refused('PUBLISHED_VALUE'));
    assert.throws(() => assertCredentialsConfigured(), refused('PUBLISHED_VALUE'));
    vi.stubEnv('DEVICE_TOKEN_SECRET', 'short');
    assert.throws(() => deviceTokenSecret(), refused('MIN_LENGTH'));
    vi.stubEnv('DEVICE_TOKEN_SECRET', real());
    assertCredentialsConfigured();
  });

  it('in production the published entitlement key signs nothing', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('DEVICE_TOKEN_SECRET', real());
    vi.stubEnv('ENTITLEMENT_PRIVATE_KEY', devKeys.privateHex);
    const refused = (e: unknown) =>
      e instanceof SecretPolicyError && e.variable === 'ENTITLEMENT_PRIVATE_KEY';
    assert.throws(() => assertCredentialsConfigured(), refused);
    await assert.rejects(signEntitlement({} as never), refused);
  });
});

describe('the cron guard under the policy', () => {
  const weak = 'ci-only-not-a-real-secret';
  const call = (secret: string) =>
    new Request('https://portal.test/api/cron/usage', {
      headers: { authorization: `Bearer ${secret}` },
    });

  it('outside production a short secret still opens the route to its bearer', () => {
    assert.equal(cronAuth(call(weak), weak), 'ok');
  });

  it('in production a published or short secret closes the route, even to its own bearer', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    assert.equal(cronAuth(call(weak), weak), 'disabled');
    assert.equal(cronAuth(call('short'), 'short'), 'disabled');
    const strong = real();
    assert.equal(cronAuth(call(strong), strong), 'ok');
    assert.equal(cronAuth(call(weak), strong), 'unauthorized');
  });

  it('handleCron reports why the route is closed, naming the variable and not the value', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const reported: unknown[] = [];
    const run = vi.fn(async () => ({}));
    const res = await handleCron(call(weak), {
      secret: weak,
      now: () => new Date(),
      run,
      report: (e) => reported.push(e),
      failure: 'usage_failed',
    });
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: 'cron_disabled' });
    assert.equal(run.mock.calls.length, 0);
    const [error] = reported;
    assert.ok(error instanceof SecretPolicyError && error.variable === 'CRON_SECRET');
    assert.ok(!error.message.includes(weak));
  });

  it('an unset secret is still just closed: nothing to report', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const reported: unknown[] = [];
    const res = await handleCron(call(weak), {
      secret: undefined,
      now: () => new Date(),
      run: async () => ({}),
      report: (e) => reported.push(e),
      failure: 'usage_failed',
    });
    assert.equal(res.status, 503);
    assert.deepEqual(reported, []);
  });
});
