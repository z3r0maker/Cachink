import { describe, expect, it } from 'vitest';
import { ConversionSchema } from '../../src/entities/conversion.js';

const VALID_ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const VALID_ULID2 = '01HZ8XQN9GZJXV8AKQ5X0C7BK1';
const VALID_ULID3 = '01HZ8XQN9GZJXV8AKQ5X0C7BK2';
const VALID_ULID4 = '01HZ8XQN9GZJXV8AKQ5X0C7BK3';
const VALID_AUDIT = {
  businessId: VALID_ULID,
  deviceId: VALID_ULID,
  createdAt: '2026-05-09T12:00:00.000Z',
  updatedAt: '2026-05-09T12:00:00.000Z',
  deletedAt: null,
};

describe('ConversionSchema', () => {
  it('validates a complete conversion record', () => {
    const result = ConversionSchema.safeParse({
      id: VALID_ULID,
      recetaId: VALID_ULID2,
      materiaPrimaId: VALID_ULID3,
      productoResultanteId: VALID_ULID4,
      cantidadOrigenUsada: 2,
      cantidadResultanteCreada: 20,
      movimientoSalidaId: VALID_ULID2,
      movimientoEntradaId: VALID_ULID3,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required recetaId field', () => {
    const result = ConversionSchema.safeParse({
      id: VALID_ULID,
      materiaPrimaId: VALID_ULID3,
      productoResultanteId: VALID_ULID4,
      cantidadOrigenUsada: 2,
      cantidadResultanteCreada: 20,
      movimientoSalidaId: VALID_ULID2,
      movimientoEntradaId: VALID_ULID3,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid branded ID', () => {
    const result = ConversionSchema.safeParse({
      id: 'not-valid',
      recetaId: VALID_ULID2,
      materiaPrimaId: VALID_ULID3,
      productoResultanteId: VALID_ULID4,
      cantidadOrigenUsada: 2,
      cantidadResultanteCreada: 20,
      movimientoSalidaId: VALID_ULID2,
      movimientoEntradaId: VALID_ULID3,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive cantidadOrigenUsada', () => {
    const result = ConversionSchema.safeParse({
      id: VALID_ULID,
      recetaId: VALID_ULID2,
      materiaPrimaId: VALID_ULID3,
      productoResultanteId: VALID_ULID4,
      cantidadOrigenUsada: 0,
      cantidadResultanteCreada: 20,
      movimientoSalidaId: VALID_ULID2,
      movimientoEntradaId: VALID_ULID3,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });
});
