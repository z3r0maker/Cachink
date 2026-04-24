import { describe, it, expect } from 'vitest';
import { DayCloseSchema, NewDayCloseSchema, DayCloseRoleEnum } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const CLOSE_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF5';

const validClose = {
  id: CLOSE_ID,
  fecha: '2026-04-23',
  efectivoEsperadoCentavos: 250_000n,
  efectivoContadoCentavos: 248_000n,
  diferenciaCentavos: -2000n,
  explicacion: 'Cambio para cliente',
  cerradoPor: 'Operativo' as const,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T19:00:00.000Z',
  updatedAt: '2026-04-23T19:00:00.000Z',
  deletedAt: null,
};

describe('DayCloseSchema', () => {
  it('accepts a well-formed close with diferencia = contado - esperado', () => {
    expect(() => DayCloseSchema.parse(validClose)).not.toThrow();
  });

  it('accepts a zero-diferencia close', () => {
    expect(() =>
      DayCloseSchema.parse({
        ...validClose,
        efectivoContadoCentavos: 250_000n,
        diferenciaCentavos: 0n,
        explicacion: null,
      }),
    ).not.toThrow();
  });

  it('accepts a positive diferencia (overage)', () => {
    expect(() =>
      DayCloseSchema.parse({
        ...validClose,
        efectivoContadoCentavos: 252_000n,
        diferenciaCentavos: 2000n,
      }),
    ).not.toThrow();
  });

  it('accepts a Director close', () => {
    expect(() => DayCloseSchema.parse({ ...validClose, cerradoPor: 'Director' })).not.toThrow();
  });

  it('rejects a close where diferencia does not match contado-esperado', () => {
    expect(() =>
      DayCloseSchema.parse({
        ...validClose,
        diferenciaCentavos: 999n,
      }),
    ).toThrow(/diferenciaCentavos must equal/);
  });

  it('rejects an unknown cerradoPor role', () => {
    expect(() => DayCloseSchema.parse({ ...validClose, cerradoPor: 'Admin' })).toThrow();
  });

  it('rejects a missing fecha', () => {
    const { fecha: _f, ...rest } = validClose;
    expect(() => DayCloseSchema.parse(rest)).toThrow();
  });

  it('rejects an explicacion over 500 chars', () => {
    expect(() => DayCloseSchema.parse({ ...validClose, explicacion: 'x'.repeat(501) })).toThrow();
  });
});

describe('NewDayCloseSchema', () => {
  it('accepts a minimal input without diferencia (computed later)', () => {
    expect(() =>
      NewDayCloseSchema.parse({
        fecha: '2026-04-23',
        efectivoEsperadoCentavos: 250_000n,
        efectivoContadoCentavos: 248_000n,
        cerradoPor: 'Operativo',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });
});

describe('DayCloseRoleEnum', () => {
  it('enumerates Operativo and Director', () => {
    expect(DayCloseRoleEnum.options).toEqual(['Operativo', 'Director']);
  });
});
