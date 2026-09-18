import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { ACTIVATION_CODE_REGEX } from '@xangarro/contracts';

import { ALPHABET, CODE_LENGTH, mintActivationCode } from '../src/server/activation';

/**
 * The alphabet is derived from the contract's regex rather than typed, because
 * typing alphabets went wrong three times in one day on this codebase. These
 * pin what the derivation produced, so a change to the regex is visible here.
 */
describe('activation codes', () => {
  it('derives exactly the 32 characters the contract accepts', () => {
    assert.equal(ALPHABET.length, 32);
    // ASCII order, which is what the derivation walks — digits before letters.
    assert.equal(ALPHABET.join(''), '23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
  });

  it('excludes every character a shopkeeper could misread', () => {
    // 0/O and 1/I are the pairs the contract excludes (ADR-053 Q5).
    for (const ambiguous of ['0', 'O', '1', 'I']) {
      assert.ok(!ALPHABET.includes(ambiguous), `${ambiguous} must not be mintable`);
    }
  });

  it('mints codes the contract accepts', () => {
    for (let i = 0; i < 2000; i += 1) {
      const code = mintActivationCode();
      assert.equal(code.length, CODE_LENGTH);
      assert.match(code, ACTIVATION_CODE_REGEX);
    }
  });

  it('does not repeat itself', () => {
    // 32^8 ≈ 1.1e12. Two thousand draws colliding would mean the source is not
    // random, which for a bearer credential is the failure that matters.
    const seen = new Set(Array.from({ length: 2000 }, () => mintActivationCode()));
    assert.equal(seen.size, 2000);
  });
});
