import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { BusinessId } from '../../src/ids/index.js';
import { FEATURE_FLAG_KEYS, PLATFORM_AVAILABLE } from '../../src/entities/feature-flags.js';
import {
  isPlatformAvailable,
  KILL_SWITCH_KEYS,
  PLATFORM_FLAG_DEFAULTS,
  PLATFORM_FLAG_KEYS,
  PlatformFlagSchema,
  resolvePlatformFlags,
  UnknownPlatformFlagError,
  type PlatformFlag,
} from '../../src/entities/platform-flag.js';

const IN = '01HZ8XQN9GZJXV8AKQ5X0C7BK0';
const OUT = '01HZ8XQN9GZJXV8AKQ5X0C7BK1';
const STAFF = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

function flag(extra: Partial<PlatformFlag>): PlatformFlag {
  return PlatformFlagSchema.parse({
    key: 'merma',
    mode: 'on',
    allowlistBusinessIds: [],
    reason: 'Lanzamiento general',
    updatedBy: STAFF,
    updatedAt: '2026-09-17T12:00:00.000Z',
    ...extra,
  });
}

describe('PlatformFlagSchema', () => {
  it('keys are the feature flags plus the three kill switches', () => {
    assert.deepEqual(PLATFORM_FLAG_KEYS, [...FEATURE_FLAG_KEYS, ...KILL_SWITCH_KEYS]);
    assert.deepEqual(KILL_SWITCH_KEYS, ['asesorLlm', 'comprobanteShare', 'cobrosIntegrados']);
  });

  it('defaults to the code constant for feature keys; the LLM starts dark (ADR-059)', () => {
    for (const k of FEATURE_FLAG_KEYS)
      assert.equal(PLATFORM_FLAG_DEFAULTS[k], PLATFORM_AVAILABLE[k]);
    assert.equal(PLATFORM_FLAG_DEFAULTS.asesorLlm, false);
    assert.equal(PLATFORM_FLAG_DEFAULTS.comprobanteShare, true);
    assert.equal(PLATFORM_FLAG_DEFAULTS.cobrosIntegrados, false);
  });

  it('refuses an allowlist mode with nobody on it', () => {
    const r = PlatformFlagSchema.safeParse({ ...flag({}), mode: 'allowlist' });
    assert.equal(r.success, false);
  });

  it('refuses a list on a global mode, a short reason and an unknown key', () => {
    const base = flag({});
    assert.equal(
      PlatformFlagSchema.safeParse({ ...base, allowlistBusinessIds: [IN] }).success,
      false,
    );
    assert.equal(PlatformFlagSchema.safeParse({ ...base, reason: ' x ' }).success, false);
    assert.equal(PlatformFlagSchema.safeParse({ ...base, key: 'teleport' }).success, false);
  });
});

describe('isPlatformAvailable', () => {
  const D = PLATFORM_FLAG_DEFAULTS;

  it('on releases a key for every business', () => {
    assert.equal(isPlatformAvailable('merma', OUT, [flag({ mode: 'on' })], D), true);
  });

  it('allowlist releases it only to the listed businesses', () => {
    const flags = [flag({ mode: 'allowlist', allowlistBusinessIds: [IN] })];
    assert.equal(isPlatformAvailable('merma', IN, flags, D), true);
    assert.equal(isPlatformAvailable('merma', OUT, flags, D), false);
  });

  it('a key with no row falls back to the default', () => {
    assert.equal(isPlatformAvailable('stock', IN, [flag({ mode: 'on' })], D), true);
    assert.equal(isPlatformAvailable('merma', IN, [], D), false);
    assert.equal(isPlatformAvailable('asesorLlm', IN, [], { ...D, asesorLlm: true }), true);
  });

  it('off overrides a default of true', () => {
    const flags = [flag({ key: 'stock', mode: 'off' })];
    assert.equal(D.stock, true);
    assert.equal(isPlatformAvailable('stock', IN, flags, D), false);
  });

  it('an unknown key is a typed error, not a silent false', () => {
    assert.throws(
      () => isPlatformAvailable('teleport', IN, [], D),
      (e: unknown) => e instanceof UnknownPlatformFlagError && e.code === 'UNKNOWN_PLATFORM_FLAG',
    );
  });
});

describe('the portal view shape', () => {
  it('a rule without reason or author, allowlist cut to the caller, decides the same', () => {
    const rule = {
      key: 'merma',
      mode: 'allowlist',
      allowlistBusinessIds: [],
      updatedAt: '2026-09-17T12:00:00.000Z',
    } as const;
    assert.equal(isPlatformAvailable('merma', OUT, [rule], PLATFORM_FLAG_DEFAULTS), false);
    const mine = { ...rule, allowlistBusinessIds: [IN as BusinessId] };
    assert.equal(isPlatformAvailable('merma', IN, [mine], PLATFORM_FLAG_DEFAULTS), true);
  });
});

describe('resolvePlatformFlags', () => {
  it('answers every key for one business in one pass', () => {
    const flags = [
      flag({ key: 'stock', mode: 'off' }),
      flag({ key: 'merma', mode: 'allowlist', allowlistBusinessIds: [IN] }),
    ];
    const r = resolvePlatformFlags(IN, flags, PLATFORM_FLAG_DEFAULTS);
    assert.deepEqual(Object.keys(r), [...PLATFORM_FLAG_KEYS]);
    assert.equal(r.stock, false);
    assert.equal(r.merma, true);
    assert.equal(r.barcode, true);
    assert.equal(resolvePlatformFlags(OUT, flags, PLATFORM_FLAG_DEFAULTS).merma, false);
  });
});
