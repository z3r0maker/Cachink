import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  ProductImageMissingError,
  ProductImageTooLargeError,
  ProductImageUnreadableError,
} from '../../src/index.js';

describe('product photo errors (M-13, ADR-134)', () => {
  it('too large carries the weight and the limit, in the screen’s words', () => {
    const e = new ProductImageTooLargeError(52_000);
    assert.equal(e.code, 'PRODUCT_IMAGE_TOO_LARGE');
    assert.equal(e.bytes, 52_000);
    assert.equal(e.name, 'ProductImageTooLargeError');
    assert.ok(e instanceof Error);
    assert.match(e.message, /foto/);
  });

  it('missing names the product whose photo was not there to remove', () => {
    const e = new ProductImageMissingError('01HZ8XQN9GZJXV8AKQ5X0C7TEZ');
    assert.equal(e.code, 'PRODUCT_IMAGE_MISSING');
    assert.equal(e.productoId, '01HZ8XQN9GZJXV8AKQ5X0C7TEZ');
    assert.match(e.message, /no tiene foto/);
  });

  it('unreadable says the photo could not be opened', () => {
    const e = new ProductImageUnreadableError();
    assert.equal(e.code, 'PRODUCT_IMAGE_UNREADABLE');
    assert.equal(e.name, 'ProductImageUnreadableError');
    assert.match(e.message, /No pude abrir la foto/);
  });

  it('the three codes are distinct, so the screen can tell them apart', () => {
    const codes = new Set([
      new ProductImageTooLargeError(1).code,
      new ProductImageMissingError('x').code,
      new ProductImageUnreadableError().code,
    ]);
    assert.equal(codes.size, 3);
  });
});
