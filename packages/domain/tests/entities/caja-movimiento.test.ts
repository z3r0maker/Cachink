import { describe, it, expect } from 'vitest';
import {
  CajaMovimientoSchema,
  CajaMovimientoTipoEnum,
  NewCajaMovimientoSchema,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const TURNO_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEQ';
const USER_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TER';
const MOV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TES';

const validMovimiento = {
  id: MOV_ID,
  turnoId: TURNO_ID,
  tipo: 'deposito' as const,
  montoCentavos: 50000n,
  motivo: 'Cambio en monedas',
  userId: USER_ID,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('CajaMovimientoSchema', () => {
  it('accepts a well-formed deposito movimiento', () => {
    expect(() => CajaMovimientoSchema.parse(validMovimiento)).not.toThrow();
  });

  it('accepts a retiro movimiento', () => {
    expect(() =>
      CajaMovimientoSchema.parse({ ...validMovimiento, tipo: 'retiro' }),
    ).not.toThrow();
  });

  it('rejects an unknown tipo', () => {
    expect(() =>
      CajaMovimientoSchema.parse({ ...validMovimiento, tipo: 'ajuste' }),
    ).toThrow();
  });

  it('rejects empty motivo', () => {
    expect(() =>
      CajaMovimientoSchema.parse({ ...validMovimiento, motivo: '' }),
    ).toThrow();
  });

  it('rejects motivo longer than 200 chars', () => {
    expect(() =>
      CajaMovimientoSchema.parse({
        ...validMovimiento,
        motivo: 'x'.repeat(201),
      }),
    ).toThrow();
  });

  it('rejects non-bigint monto', () => {
    expect(() =>
      CajaMovimientoSchema.parse({ ...validMovimiento, montoCentavos: 500 }),
    ).toThrow();
  });
});

describe('CajaMovimientoTipoEnum', () => {
  it('enumerates deposito and retiro', () => {
    expect(CajaMovimientoTipoEnum.options).toEqual(['deposito', 'retiro']);
  });
});

describe('NewCajaMovimientoSchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      NewCajaMovimientoSchema.parse({
        turnoId: TURNO_ID,
        tipo: 'deposito',
        montoCentavos: 50000n,
        motivo: 'Cambio',
        userId: USER_ID,
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('rejects missing businessId', () => {
    expect(() =>
      NewCajaMovimientoSchema.parse({
        turnoId: TURNO_ID,
        tipo: 'deposito',
        montoCentavos: 50000n,
        motivo: 'Cambio',
        userId: USER_ID,
      }),
    ).toThrow();
  });
});
