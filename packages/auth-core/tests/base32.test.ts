import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { AuthCoreError, base32Decode, base32Encode } from '../src/index.js';

/** RFC 4648 §10, padding dropped. */
const VECTORS: ReadonlyArray<[string, string]> = [
  ['', ''],
  ['f', 'MY'],
  ['fo', 'MZXQ'],
  ['foo', 'MZXW6'],
  ['foob', 'MZXW6YQ'],
  ['fooba', 'MZXW6YTB'],
  ['foobar', 'MZXW6YTBOI'],
];

describe('base32Encode', () => {
  it('matches every RFC 4648 test vector', () => {
    for (const [plain, encoded] of VECTORS) assert.equal(base32Encode(Buffer.from(plain)), encoded);
  });

  it('never writes padding', () => {
    assert.doesNotMatch(base32Encode(Buffer.from('f')), /=/);
  });

  it('encodes arbitrary bytes, including 0x00 and 0xff', () => {
    assert.equal(base32Encode(Buffer.from([0, 0xff])), 'AD7Q');
  });
});

describe('base32Decode', () => {
  it('matches every RFC 4648 test vector', () => {
    for (const [plain, encoded] of VECTORS) {
      assert.equal(base32Decode(encoded).toString(), plain);
    }
  });

  it('accepts lower case, spaces and padding, as people type them', () => {
    assert.equal(base32Decode('mzxw 6ytb oi======').toString(), 'foobar');
  });

  it('round-trips random bytes', () => {
    const bytes = Buffer.from(Array.from({ length: 37 }, (_, i) => (i * 97) & 0xff));
    assert.deepEqual(base32Decode(base32Encode(bytes)), bytes);
  });

  it('refuses characters outside the alphabet', () => {
    for (const bad of ['MZ1W', 'MZ8W', 'MZXW-6', 'MZ+W']) {
      assert.throws(() => base32Decode(bad), AuthCoreError, bad);
    }
  });

  it('reports the refusal with its code', () => {
    assert.throws(() => base32Decode('0'), { code: 'INVALID_BASE32' });
  });
});
