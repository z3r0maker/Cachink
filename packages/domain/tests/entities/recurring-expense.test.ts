import { describe, it, expect } from 'vitest';
import {
  RecurringExpenseSchema,
  NewRecurringExpenseSchema,
  RecurrenceFrequencyEnum,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const REC_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF6';

const auditFields = {
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

const validMensual = {
  id: REC_ID,
  concepto: 'Renta del local',
  categoria: 'Renta' as const,
  montoCentavos: 1_200_000n,
  proveedor: 'Arrendadora del Centro',
  frecuencia: 'mensual' as const,
  diaDelMes: 1,
  diaDeLaSemana: null,
  proximoDisparo: '2026-05-01',
  activo: true,
  ...auditFields,
};

const validSemanal = {
  ...validMensual,
  frecuencia: 'semanal' as const,
  diaDelMes: null,
  diaDeLaSemana: 1,
};

const validQuincenal = {
  ...validMensual,
  frecuencia: 'quincenal' as const,
  diaDelMes: 15,
  diaDeLaSemana: null,
};

describe('RecurringExpenseSchema', () => {
  it('accepts a mensual with diaDelMes set', () => {
    expect(() => RecurringExpenseSchema.parse(validMensual)).not.toThrow();
  });

  it('accepts a semanal with diaDeLaSemana set', () => {
    expect(() => RecurringExpenseSchema.parse(validSemanal)).not.toThrow();
  });

  it('accepts a quincenal with either field set', () => {
    expect(() => RecurringExpenseSchema.parse(validQuincenal)).not.toThrow();
    expect(() =>
      RecurringExpenseSchema.parse({
        ...validQuincenal,
        diaDelMes: null,
        diaDeLaSemana: 5,
      }),
    ).not.toThrow();
  });

  it('rejects a mensual with diaDelMes null', () => {
    expect(() => RecurringExpenseSchema.parse({ ...validMensual, diaDelMes: null })).toThrow(
      /frecuencia requires/,
    );
  });

  it('rejects a semanal with diaDeLaSemana null', () => {
    expect(() => RecurringExpenseSchema.parse({ ...validSemanal, diaDeLaSemana: null })).toThrow();
  });

  it('rejects a quincenal with both day fields null', () => {
    expect(() =>
      RecurringExpenseSchema.parse({
        ...validQuincenal,
        diaDelMes: null,
        diaDeLaSemana: null,
      }),
    ).toThrow();
  });

  it('rejects diaDelMes > 31', () => {
    expect(() => RecurringExpenseSchema.parse({ ...validMensual, diaDelMes: 32 })).toThrow();
  });

  it('rejects diaDeLaSemana > 6', () => {
    expect(() => RecurringExpenseSchema.parse({ ...validSemanal, diaDeLaSemana: 7 })).toThrow();
  });

  it('rejects a missing proximoDisparo', () => {
    const { proximoDisparo: _p, ...rest } = validMensual;
    expect(() => RecurringExpenseSchema.parse(rest)).toThrow();
  });
});

describe('NewRecurringExpenseSchema', () => {
  it('accepts a minimal mensual input and defaults activo=true', () => {
    const parsed = NewRecurringExpenseSchema.parse({
      concepto: 'Internet',
      categoria: 'Servicios',
      montoCentavos: 50_000n,
      frecuencia: 'mensual',
      diaDelMes: 5,
      proximoDisparo: '2026-05-05',
      businessId: BIZ_ID,
    });
    expect(parsed.activo).toBe(true);
  });

  it('rejects input where frecuencia and day fields disagree', () => {
    expect(() =>
      NewRecurringExpenseSchema.parse({
        concepto: 'Limpieza',
        categoria: 'Servicios',
        montoCentavos: 80_000n,
        frecuencia: 'semanal',
        proximoDisparo: '2026-05-01',
        businessId: BIZ_ID,
      }),
    ).toThrow();
  });
});

describe('RecurrenceFrequencyEnum', () => {
  it('enumerates semanal / quincenal / mensual', () => {
    expect(RecurrenceFrequencyEnum.options).toEqual(['semanal', 'quincenal', 'mensual']);
  });
});
