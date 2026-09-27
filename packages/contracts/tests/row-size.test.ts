import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MAX_PUSH_ROW_BYTES, maxPushRowBytes, pushRowBytes, utf8Bytes } from '../src/row-size.js';

/**
 * Audit DB3-SYNC-01 (b): one pushed row with an unbounded text or JSON field
 * (products.atributos) could take a push past the 4.5 MB body limit. The
 * limit is measured once, here, for the server and the device alike.
 */
describe('push row size', () => {
  it('counts UTF-8 bytes, not UTF-16 code units', () => {
    assert.equal(utf8Bytes('abc'), 3);
    assert.equal(utf8Bytes('ñ'), 2);
    assert.equal(utf8Bytes('☕'), 3);
    assert.equal(utf8Bytes('😀'), 4);
    assert.equal(utf8Bytes('\uD800'), 3, 'a lone surrogate is counted as its replacement');
    assert.equal(utf8Bytes(''), 0);
  });

  it("measures a row's wire JSON, bigints included", () => {
    assert.equal(
      pushRowBytes({ monto: 4500n, nota: 'ñ' }),
      '{"monto":"4500","nota":"ñ"}'.length + 1,
    );
  });

  it('allows 16 KB a row, more only where a list is the row', () => {
    assert.equal(MAX_PUSH_ROW_BYTES, 16_384);
    assert.equal(maxPushRowBytes('products'), MAX_PUSH_ROW_BYTES);
    assert.equal(maxPushRowBytes('sales'), MAX_PUSH_ROW_BYTES);
    assert.ok(maxPushRowBytes('auditorias_inventario') >= 1_000_000, 'a count of every product');
    assert.ok(maxPushRowBytes('entregas_credito') > MAX_PUSH_ROW_BYTES, 'the sales it settles');
  });
});
