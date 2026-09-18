import { afterEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';

import * as ed from '@noble/ed25519';
import { computeEntitlement } from '@xangarro/application';
import { canonicalize } from '@xangarro/contracts';
import devKeys from '../../../packages/contracts/src/mock/dev-keys.json' with { type: 'json' };

import { signEntitlement } from '../src/server/device/credentials';

/**
 * B-06's second acceptance: the portal's signer reproduces the contract's
 * vector. Ed25519 is deterministic, so "reproduces" means byte-identical: the
 * same payload and key must give the same signature the contract test signs,
 * and the phone's verifier must accept it with the published public key.
 */
const PAYLOAD = computeEntitlement(
  '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  { planId: 'xangarro', status: 'active', currentPeriodEnd: '2026-10-11T00:00:00.000Z' },
  new Date('2026-09-11T00:00:00.000Z'),
);

const original = process.env.ENTITLEMENT_PRIVATE_KEY;
afterEach(() => {
  process.env.ENTITLEMENT_PRIVATE_KEY = original;
});

describe('signEntitlement', () => {
  it('signs exactly what the contract vector signs, and the phone verifies it', async () => {
    process.env.ENTITLEMENT_PRIVATE_KEY = devKeys.privateHex;
    const signed = await signEntitlement(PAYLOAD);

    const msg = new TextEncoder().encode(canonicalize(PAYLOAD));
    const expected = await ed.signAsync(msg, ed.etc.hexToBytes(devKeys.privateHex));
    assert.equal(signed.signature, Buffer.from(expected).toString('base64'));

    const sig = Buffer.from(signed.signature, 'base64');
    assert.equal(await ed.verifyAsync(sig, msg, ed.etc.hexToBytes(devKeys.publicHex)), true);
  });

  it('a tampered payload no longer verifies', async () => {
    process.env.ENTITLEMENT_PRIVATE_KEY = devKeys.privateHex;
    const signed = await signEntitlement(PAYLOAD);
    const forged = new TextEncoder().encode(canonicalize({ ...PAYLOAD, plan: 'xangarrote' }));
    const sig = Buffer.from(signed.signature, 'base64');
    assert.equal(await ed.verifyAsync(sig, forged, ed.etc.hexToBytes(devKeys.publicHex)), false);
  });

  it('refuses to sign without a key — there is no default to fall back to', async () => {
    delete process.env.ENTITLEMENT_PRIVATE_KEY;
    await assert.rejects(signEntitlement(PAYLOAD), /ENTITLEMENT_PRIVATE_KEY is not set/);
  });

  it('refuses a payload that is not a valid entitlement', async () => {
    process.env.ENTITLEMENT_PRIVATE_KEY = devKeys.privateHex;
    await assert.rejects(signEntitlement({ ...PAYLOAD, plan: 'gold' as 'xangarro' }));
  });
});
