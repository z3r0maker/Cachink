import { describe, it, expect } from 'vitest';
import {
  EmployeeSchema,
  NewEmployeeSchema,
  PayrollFrequencyEnum,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const EMP_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF1';

const validEmployee = {
  id: EMP_ID,
  nombre: 'María Pérez',
  puesto: 'Cajera',
  salarioCentavos: 3_500_000n,
  periodo: 'quincenal' as const,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('EmployeeSchema', () => {
  it('accepts a well-formed Employee', () => {
    expect(() => EmployeeSchema.parse(validEmployee)).not.toThrow();
  });

  it('rejects an unknown periodo', () => {
    expect(() => EmployeeSchema.parse({ ...validEmployee, periodo: 'diario' })).toThrow();
  });

  it('rejects an empty nombre', () => {
    expect(() => EmployeeSchema.parse({ ...validEmployee, nombre: '' })).toThrow();
  });

  it('rejects a missing puesto', () => {
    const { puesto: _p, ...rest } = validEmployee;
    expect(() => EmployeeSchema.parse(rest)).toThrow();
  });

  it('rejects salarioCentavos as a plain number', () => {
    expect(() =>
      EmployeeSchema.parse({
        ...validEmployee,
        salarioCentavos: 3_500_000 as unknown as bigint,
      }),
    ).toThrow();
  });
});

describe('NewEmployeeSchema', () => {
  it('accepts a minimal input payload', () => {
    expect(() =>
      NewEmployeeSchema.parse({
        nombre: 'Juan López',
        puesto: 'Chef',
        salarioCentavos: 5_000_000n,
        periodo: 'mensual',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });
});

describe('PayrollFrequencyEnum', () => {
  it('enumerates semanal / quincenal / mensual', () => {
    expect(PayrollFrequencyEnum.options).toEqual(['semanal', 'quincenal', 'mensual']);
  });
});
