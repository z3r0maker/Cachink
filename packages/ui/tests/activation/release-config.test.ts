/**
 * The release configuration's rules (audit F-15d). `production` is what an
 * EAS production build must carry, checked by the build gate
 * (`apps/mobile/scripts/check-release-config.mjs`); `runnable` is the least
 * any release build needs to run at all, checked when the app starts, so a
 * missing value is said out loud instead of becoming the local mock or the
 * free plan.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { DEV_ENTITLEMENT_PUBLIC_KEY_HEX } from '../../src/activation/activation-config';
import {
  releaseConfigProblems,
  resolveRuntimeConfig,
  type ReleaseConfigInput,
} from '../../src/activation/release-config';

const KEY = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';
const GOOD: ReleaseConfigInput = {
  apiBase: 'https://app.xangarro.mx',
  entitlementPublicKeyHex: KEY,
};

const codes = (input: ReleaseConfigInput, rules?: 'production' | 'runnable'): string[] =>
  releaseConfigProblems(input, rules).map((p) => p.code);

describe('releaseConfigProblems: a production build', () => {
  it('finds nothing wrong with an https base and the backend’s own key', () => {
    assert.deepEqual(releaseConfigProblems(GOOD), []);
    assert.deepEqual(codes({ ...GOOD, entitlementPublicKeyHex: KEY.toUpperCase() }), []);
  });

  it('refuses a missing API base', () => {
    for (const apiBase of [undefined, '', '   ']) {
      assert.deepEqual(codes({ ...GOOD, apiBase }), ['API_BASE_MISSING']);
    }
  });

  it('refuses an API base that is not https', () => {
    for (const apiBase of ['http://app.xangarro.mx', 'http://127.0.0.1:3000', 'app.xangarro.mx']) {
      assert.deepEqual(codes({ ...GOOD, apiBase }), ['API_BASE_NOT_HTTPS']);
    }
  });

  it('names a value that was never filled in', () => {
    const [problem] = releaseConfigProblems({ ...GOOD, apiBase: '$PRODUCTION_API_BASE' });
    assert.equal(problem?.code, 'API_BASE_NOT_HTTPS');
    assert.equal(problem?.field, 'apiBase');
    assert.match(problem?.message ?? '', /\$PRODUCTION_API_BASE/);
    assert.match(problem?.message ?? '', /placeholder/);
  });

  it('refuses a public key that is not 64 hex characters', () => {
    const bad = [undefined, '', KEY.slice(1), `${KEY}0`, `${KEY.slice(2)}zz`, '$PRODUCTION_KEY'];
    for (const entitlementPublicKeyHex of bad) {
      const found = releaseConfigProblems({ ...GOOD, entitlementPublicKeyHex });
      assert.deepEqual(
        found.map((p) => [p.code, p.field]),
        [['PUBKEY_MALFORMED', 'entitlementPublicKeyHex']],
      );
    }
  });

  it('refuses the published dev key, in any case', () => {
    assert.equal(DEV_ENTITLEMENT_PUBLIC_KEY_HEX.slice(0, 6), 'd75a98');
    for (const k of [
      DEV_ENTITLEMENT_PUBLIC_KEY_HEX,
      DEV_ENTITLEMENT_PUBLIC_KEY_HEX.toUpperCase(),
    ]) {
      assert.deepEqual(codes({ ...GOOD, entitlementPublicKeyHex: k }), ['PUBKEY_IS_DEV_KEY']);
    }
  });

  it('reports every problem at once, the API base first', () => {
    assert.deepEqual(codes({ apiBase: undefined, entitlementPublicKeyHex: undefined }), [
      'API_BASE_MISSING',
      'PUBKEY_MALFORMED',
    ]);
  });
});

describe('releaseConfigProblems: any release build that is to run', () => {
  const mock = { apiBase: 'http://127.0.0.1:3000', entitlementPublicKeyHex: KEY };

  it('accepts what a local release build against the mock carries', () => {
    assert.deepEqual(codes(mock, 'runnable'), []);
    const devKey = { ...mock, entitlementPublicKeyHex: DEV_ENTITLEMENT_PUBLIC_KEY_HEX };
    assert.deepEqual(codes(devKey, 'runnable'), []);
  });

  it('refuses a missing API base, and one that is no URL at all', () => {
    assert.deepEqual(codes({ ...mock, apiBase: undefined }, 'runnable'), ['API_BASE_MISSING']);
    assert.deepEqual(codes({ ...mock, apiBase: '$PREVIEW_API_BASE' }, 'runnable'), [
      'API_BASE_INVALID',
    ]);
  });

  it('refuses a missing or malformed public key', () => {
    assert.deepEqual(codes({ ...mock, entitlementPublicKeyHex: '' }, 'runnable'), [
      'PUBKEY_MALFORMED',
    ]);
  });
});

describe('resolveRuntimeConfig', () => {
  const DEV_BASE = 'http://127.0.0.1:3000';
  const unset = { apiBase: undefined, entitlementPublicKeyHex: undefined, devApiBase: DEV_BASE };

  it('in development, falls back to the mock and its key', () => {
    assert.deepEqual(resolveRuntimeConfig({ ...unset, isDev: true }), {
      apiBase: DEV_BASE,
      entitlementPublicKeyHex: DEV_ENTITLEMENT_PUBLIC_KEY_HEX,
      problems: [],
    });
  });

  it('in development, takes what the environment names', () => {
    const r = resolveRuntimeConfig({ ...unset, ...GOOD, isDev: true });
    assert.deepEqual([r.apiBase, r.entitlementPublicKeyHex], [GOOD.apiBase, KEY]);
  });

  it('in a release build, never falls back: it says what is missing', () => {
    const r = resolveRuntimeConfig({ ...unset, isDev: false });
    assert.equal(r.apiBase, '');
    assert.equal(r.entitlementPublicKeyHex, '');
    assert.deepEqual(
      r.problems.map((p) => p.code),
      ['API_BASE_MISSING', 'PUBKEY_MALFORMED'],
    );
  });

  it('in a release build, drops only the value that is unusable', () => {
    const r = resolveRuntimeConfig({ ...unset, apiBase: GOOD.apiBase, isDev: false });
    assert.equal(r.apiBase, GOOD.apiBase);
    assert.equal(r.entitlementPublicKeyHex, '');
    assert.deepEqual(
      r.problems.map((p) => p.code),
      ['PUBKEY_MALFORMED'],
    );
  });

  it('in a release build, runs with a complete configuration', () => {
    const r = resolveRuntimeConfig({ ...unset, ...GOOD, isDev: false });
    assert.deepEqual(r, { apiBase: GOOD.apiBase, entitlementPublicKeyHex: KEY, problems: [] });
  });
});
