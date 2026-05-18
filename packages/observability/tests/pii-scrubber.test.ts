/**
 * PII scrubber tests.
 *
 * Verifies that user-entered free-text fields are redacted before export.
 */

import { describe, it, expect } from 'vitest';
import { scrubRecord, scrubLogMetadata } from '../src/pii-scrubber.js';

describe('scrubRecord', () => {
  it('redacts known PII fields', () => {
    const input = {
      concepto: 'Venta de tacos al pastor',
      montoCentavos: 15000,
      nombre: 'Juan Pérez',
      telefono: '55-1234-5678',
    };
    const result = scrubRecord(input);

    expect(result.concepto).toBe('[REDACTED]');
    expect(result.nombre).toBe('[REDACTED]');
    expect(result.telefono).toBe('[REDACTED]');
    expect(result.montoCentavos).toBe(15000);
  });

  it('does not mutate the original object', () => {
    const input = { nombre: 'Maria', amount: 100 };
    const result = scrubRecord(input);

    expect(input.nombre).toBe('Maria');
    expect(result.nombre).toBe('[REDACTED]');
  });

  it('recursively scrubs nested objects', () => {
    const input = {
      data: {
        nota: 'Some private note',
        value: 42,
      },
      topLevel: 'ok',
    };
    const result = scrubRecord(input);

    expect((result.data as Record<string, unknown>).nota).toBe('[REDACTED]');
    expect((result.data as Record<string, unknown>).value).toBe(42);
    expect(result.topLevel).toBe('ok');
  });

  it('handles empty objects', () => {
    expect(scrubRecord({})).toEqual({});
  });
});

describe('scrubLogMetadata', () => {
  it('returns undefined for undefined input', () => {
    expect(scrubLogMetadata(undefined)).toBeUndefined();
  });

  it('scrubs metadata record', () => {
    const result = scrubLogMetadata({
      email: 'user@example.com',
      action: 'submit',
    });
    expect(result!.email).toBe('[REDACTED]');
    expect(result!.action).toBe('submit');
  });
});
