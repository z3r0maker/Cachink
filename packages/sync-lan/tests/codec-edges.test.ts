import { describe, expect, it } from 'vitest';

import { decodeDelta, encodeDelta } from '../src/protocol/codec.js';

/**
 * The codec's refusals and quiet coercions — the branches a clean round-trip
 * never takes. Money travels as a decimal string; it may arrive as one, as a
 * safe integer, or not at all, and anything else is a TypeError in the
 * column's own words rather than a silent NaN.
 */

const ULID = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';
const ISO = '2026-05-12T10:00:00.000Z';

const fila = (over: Record<string, unknown> = {}) => ({
  id: ULID,
  updated_at: ISO,
  device_id: ULID,
  monto_centavos: 450_00n,
  concepto: 'Tacos',
  ...over,
});

describe('encodeDelta · money and envelope edges', () => {
  it('accepts money already written as a decimal string, or as a safe integer', () => {
    expect(
      encodeDelta('sales', fila({ monto_centavos: '45000' }), 'insert').row['monto_centavos'],
    ).toBe('45000');
    expect(
      encodeDelta('sales', fila({ monto_centavos: 45000 }), 'insert').row['monto_centavos'],
    ).toBe('45000');
    expect(
      encodeDelta('sales', fila({ monto_centavos: -12 }), 'insert').row['monto_centavos'],
    ).toBe('-12');
  });

  it('keeps a null amount null — a refund row has no money to say', () => {
    expect(
      encodeDelta('sales', fila({ monto_centavos: null }), 'insert').row['monto_centavos'],
    ).toBeNull();
  });

  it('refuses money that is neither: in the column’s own words', () => {
    expect(() => encodeDelta('sales', fila({ monto_centavos: 'abc' }), 'insert')).toThrow(
      /monto_centavos/,
    );
    expect(() => encodeDelta('sales', fila({ monto_centavos: 1.5 }), 'insert')).toThrow(TypeError);
  });

  it('an unexpected bigint on a non-money column travels as text, not "[object]"', () => {
    expect(encodeDelta('sales', fila({ version: 7n }), 'insert').row['version']).toBe('7');
  });

  it('drops undefined values — JSON has nothing to say for them', () => {
    const row = encodeDelta('sales', fila({ concepto: undefined }), 'insert').row;
    expect('concepto' in row).toBe(false);
  });

  it('refuses a row without its envelope: no id, no stamp, no device', () => {
    expect(() => encodeDelta('sales', fila({ id: '' }), 'insert')).toThrow(/"id"/);
    expect(() => encodeDelta('sales', fila({ updated_at: undefined }), 'insert')).toThrow(
      /updated_at/,
    );
    expect(() => encodeDelta('sales', fila({ device_id: 42 }), 'insert')).toThrow(/device_id/);
  });
});

describe('decodeDelta · money back to bigint, everything else as it came', () => {
  const delta = (row: Record<string, unknown>) => ({
    table: 'sales',
    op: 'insert' as const,
    rowId: ULID,
    rowUpdatedAt: ISO,
    rowDeviceId: ULID,
    row,
  });

  it('a decimal string becomes bigint; a safe integer does too', () => {
    expect(decodeDelta(delta({ monto_centavos: '45000' })).decodedRow['monto_centavos']).toBe(
      45000n,
    );
    expect(decodeDelta(delta({ monto_centavos: -3 })).decodedRow['monto_centavos']).toBe(-3n);
  });

  it('null stays null; non-money columns pass through untouched', () => {
    const out = decodeDelta(
      delta({ monto_centavos: null, concepto: 'Tacos', folio: 12 }),
    ).decodedRow;
    expect(out['monto_centavos']).toBeNull();
    expect(out['concepto']).toBe('Tacos');
    expect(out['folio']).toBe(12);
  });

  it('money that decodes to nothing is a TypeError, not a NaN', () => {
    expect(() => decodeDelta(delta({ monto_centavos: 'cuarenta' }))).toThrow(/monto_centavos/);
    expect(() => decodeDelta(delta({ monto_centavos: 1.25 }))).toThrow(TypeError);
  });

  it('an envelope that is not a Delta is refused by the schema', () => {
    expect(() => decodeDelta({ table: 'sales' })).toThrow();
  });
});
