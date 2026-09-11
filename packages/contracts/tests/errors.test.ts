import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  ERROR_CATALOG,
  ErrorEnvelopeSchema,
  isKnownErrorCode,
  isRetryableError,
} from '../src/errors.js';

describe('ErrorEnvelopeSchema', () => {
  it('accepts a well-formed envelope and strips nothing it needs', () => {
    const parsed = ErrorEnvelopeSchema.parse({
      error: { code: 'CODE_EXPIRED', message: 'El código venció', details: { at: 'x' } },
    });
    assert.equal(parsed.error.code, 'CODE_EXPIRED');
    assert.deepEqual(parsed.error.details, { at: 'x' });
  });

  it('rejects a lowercase code', () => {
    assert.throws(() => ErrorEnvelopeSchema.parse({ error: { code: 'bad', message: 'x' } }));
  });

  it('rejects an empty message', () => {
    assert.throws(() => ErrorEnvelopeSchema.parse({ error: { code: 'OK', message: '' } }));
  });

  it('rejects a missing error object', () => {
    assert.throws(() => ErrorEnvelopeSchema.parse({ code: 'OK' }));
  });
});

describe('isRetryableError', () => {
  it('treats 5xx as retryable and 4xx as terminal for codes not in the catalog', () => {
    assert.equal(isRetryableError('SOMETHING_NEW', 500), true);
    assert.equal(isRetryableError('SOMETHING_NEW', 400), false);
  });

  it('lets the catalog win over the status for known codes', () => {
    assert.equal(isRetryableError('VALIDATION', 500), false);
  });

  it('lets a terminal code override a 5xx status', () => {
    assert.equal(isRetryableError('DEVICE_REVOKED', 503), false);
  });

  it('lets a retryable code override a 4xx status', () => {
    assert.equal(isRetryableError('RATE_LIMITED', 429), true);
  });

  it('every catalog entry has a UPPER_SNAKE code, an HTTP status and a message key', () => {
    for (const [code, entry] of Object.entries(ERROR_CATALOG)) {
      assert.match(code, /^[A-Z][A-Z0-9_]*$/);
      assert.ok(entry.httpStatus >= 200 && entry.httpStatus < 600, code);
      assert.match(entry.userMessageKey, /^[a-z]+\.errors\.[a-zA-Z]+$/, code);
      assert.equal(isKnownErrorCode(code), true);
    }
    assert.equal(isKnownErrorCode('NOPE'), false);
  });
});
