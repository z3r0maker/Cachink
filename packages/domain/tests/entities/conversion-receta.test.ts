import { describe, expect, it } from 'vitest';
import { ConversionRecetaSchema, NewConversionRecetaSchema } from '../../src/entities/conversion-receta.js';

const VALID_ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const VALID_ULID2 = '01HZ8XQN9GZJXV8AKQ5X0C7BK1';
const VALID_AUDIT = {
  businessId: VALID_ULID,
  deviceId: VALID_ULID,
  createdAt: '2026-05-09T12:00:00.000Z',
  updatedAt: '2026-05-09T12:00:00.000Z',
  deletedAt: null,
};

describe('ConversionRecetaSchema', () => {
  it('validates a complete recipe', () => {
    const result = ConversionRecetaSchema.safeParse({
      id: VALID_ULID,
      materiaPrimaId: VALID_ULID,
      productoResultanteId: VALID_ULID2,
      cantidadOrigen: 1,
      cantidadResultante: 10,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required productoResultanteId', () => {
    const result = ConversionRecetaSchema.safeParse({
      id: VALID_ULID,
      materiaPrimaId: VALID_ULID,
      cantidadOrigen: 1,
      cantidadResultante: 10,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid branded ID', () => {
    const result = ConversionRecetaSchema.safeParse({
      id: 'bad-id',
      materiaPrimaId: VALID_ULID,
      productoResultanteId: VALID_ULID2,
      cantidadOrigen: 1,
      cantidadResultante: 10,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive cantidadOrigen', () => {
    const result = ConversionRecetaSchema.safeParse({
      id: VALID_ULID,
      materiaPrimaId: VALID_ULID,
      productoResultanteId: VALID_ULID2,
      cantidadOrigen: 0,
      cantidadResultante: 10,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });
});

describe('NewConversionRecetaSchema', () => {
  it('validates valid new recipe input', () => {
    const result = NewConversionRecetaSchema.safeParse({
      materiaPrimaId: VALID_ULID,
      productoResultanteId: VALID_ULID2,
      cantidadOrigen: 1,
      cantidadResultante: 10,
      businessId: VALID_ULID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive cantidadResultante', () => {
    const result = NewConversionRecetaSchema.safeParse({
      materiaPrimaId: VALID_ULID,
      productoResultanteId: VALID_ULID2,
      cantidadOrigen: 1,
      cantidadResultante: -5,
      businessId: VALID_ULID,
    });
    expect(result.success).toBe(false);
  });
});
