import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ErrorEnvelopeSchema, isRetryableError } from '../src/errors.js';

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
  it('treats 5xx as retryable and 4xx as terminal by default', () => {
    assert.equal(isRetryableError('VALIDATION', 500), true);
    assert.equal(isRetryableError('VALIDATION', 400), false);
  });

  it('lets a terminal code override a 5xx status', () => {
    assert.equal(isRetryableError('DEVICE_REVOKED', 503), false);
  });

  it('lets a retryable code override a 4xx status', () => {
    assert.equal(isRetryableError('RATE_LIMITED', 429), true);
  });
});
