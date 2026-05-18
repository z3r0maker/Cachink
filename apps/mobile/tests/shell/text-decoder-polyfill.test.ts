/**
 * TextDecoder polyfill tests — verifies that unsupported encodings
 * are safely mapped to utf-8 without throwing.
 */

import { describe, expect, it, beforeAll } from 'vitest';

// Import the polyfill — applies the patch to globalThis.TextDecoder
beforeAll(async () => {
  await import('../../src/shell/text-decoder-polyfill');
});

describe('TextDecoder polyfill', () => {
  it('new TextDecoder("ascii") does not throw after polyfill', () => {
    expect(() => new TextDecoder('ascii')).not.toThrow();
    const decoder = new TextDecoder('ascii');
    const result = decoder.decode(new Uint8Array([72, 101, 108, 108, 111]));
    expect(result).toBe('Hello');
  });

  it('new TextDecoder("us-ascii") maps to utf-8', () => {
    expect(() => new TextDecoder('us-ascii')).not.toThrow();
    const decoder = new TextDecoder('us-ascii');
    const result = decoder.decode(new Uint8Array([87, 111, 114, 108, 100]));
    expect(result).toBe('World');
  });

  it('new TextDecoder("utf-8") still works (no regression)', () => {
    const decoder = new TextDecoder('utf-8');
    const result = decoder.decode(new Uint8Array([0xC2, 0xA1, 72, 111, 108, 97, 0x21]));
    expect(result).toBe('¡Hola!');
  });

  it('new TextDecoder() defaults to utf-8', () => {
    const decoder = new TextDecoder();
    expect(decoder.encoding).toBe('utf-8');
    const result = decoder.decode(new Uint8Array([67, 97, 99, 104, 105, 110, 107]));
    expect(result).toBe('Cachink');
  });
});
