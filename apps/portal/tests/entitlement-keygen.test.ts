import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'vitest';

import * as ed from '@noble/ed25519';
import { computeEntitlement } from '@xangarro/application';
import { canonicalize } from '@xangarro/contracts';

import { generateEntitlementKeypair } from '../scripts/entitlement-keygen';
import { signEntitlement } from '../src/server/device/credentials';

/**
 * B-01: `entitlement:keygen` prints a private key in exactly the format the
 * portal's signer reads, and the public key the phone verifies with.
 */
const original = process.env.ENTITLEMENT_PRIVATE_KEY;
afterEach(() => {
  process.env.ENTITLEMENT_PRIVATE_KEY = original;
});

describe('generateEntitlementKeypair', () => {
  it('gives two 32-byte hex keys, fresh each time', async () => {
    const a = await generateEntitlementKeypair();
    const b = await generateEntitlementKeypair();
    assert.match(a.privateHex, /^[0-9a-f]{64}$/);
    assert.match(a.publicHex, /^[0-9a-f]{64}$/);
    assert.notEqual(a.privateHex, b.privateHex);
  });

  it("signs through the portal's signer and verifies with the printed public key", async () => {
    const keys = await generateEntitlementKeypair();
    process.env.ENTITLEMENT_PRIVATE_KEY = keys.privateHex;
    const payload = computeEntitlement(
      '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      { planId: 'xangarro', status: 'active', currentPeriodEnd: '2026-10-11T00:00:00.000Z' },
      new Date('2026-09-11T00:00:00.000Z'),
    );
    const { signature } = await signEntitlement(payload);
    const ok = await ed.verifyAsync(
      Buffer.from(signature, 'base64'),
      new TextEncoder().encode(canonicalize(payload)),
      ed.etc.hexToBytes(keys.publicHex),
    );
    assert.equal(ok, true);
  });
});
