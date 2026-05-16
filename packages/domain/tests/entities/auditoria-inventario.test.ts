import { describe, expect, it } from 'vitest';
import { AuditoriaInventarioSchema, AuditoriaEstadoEnum } from '../../src/entities/auditoria-inventario.js';

const VALID_ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const VALID_AUDIT = {
  businessId: VALID_ULID,
  deviceId: VALID_ULID,
  createdAt: '2026-05-09T12:00:00.000Z',
  updatedAt: '2026-05-09T12:00:00.000Z',
  deletedAt: null,
};

describe('AuditoriaInventarioSchema', () => {
  it('validates a complete auditoria record', () => {
    const result = AuditoriaInventarioSchema.safeParse({
      id: VALID_ULID,
      fecha: '2026-05-09',
      estado: 'borrador',
      lineas: '[]',
      totalDiscrepancias: 0,
      totalProductos: 10,
      productosContados: 0,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required id field', () => {
    const result = AuditoriaInventarioSchema.safeParse({
      fecha: '2026-05-09',
      estado: 'borrador',
      lineas: '[]',
      totalDiscrepancias: 0,
      totalProductos: 10,
      productosContados: 0,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid branded ID', () => {
    const result = AuditoriaInventarioSchema.safeParse({
      id: 'not-a-ulid',
      fecha: '2026-05-09',
      estado: 'borrador',
      lineas: '[]',
      totalDiscrepancias: 0,
      totalProductos: 10,
      productosContados: 0,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid estado enum value', () => {
    const result = AuditoriaInventarioSchema.safeParse({
      id: VALID_ULID,
      fecha: '2026-05-09',
      estado: 'desconocido',
      lineas: '[]',
      totalDiscrepancias: 0,
      totalProductos: 10,
      productosContados: 0,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('accepts cancelada as a valid estado', () => {
    const result = AuditoriaInventarioSchema.safeParse({
      id: VALID_ULID,
      fecha: '2026-05-09',
      estado: 'cancelada',
      lineas: '[]',
      totalDiscrepancias: 0,
      totalProductos: 10,
      productosContados: 0,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(true);
  });
});

describe('AuditoriaEstadoEnum', () => {
  it('accepts borrador, finalizada, and cancelada', () => {
    expect(AuditoriaEstadoEnum.safeParse('borrador').success).toBe(true);
    expect(AuditoriaEstadoEnum.safeParse('finalizada').success).toBe(true);
    expect(AuditoriaEstadoEnum.safeParse('cancelada').success).toBe(true);
  });
});
