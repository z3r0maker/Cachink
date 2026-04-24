import { describe, it, expect } from 'vitest';
import { ExpenseSchema, NewExpenseSchema, ExpenseCategoryEnum } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const EXP_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEX';
const REC_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEY';

const validExpense = {
  id: EXP_ID,
  fecha: '2026-04-23',
  concepto: 'Renta del local',
  categoria: 'Renta' as const,
  monto: 1_200_000n,
  proveedor: 'Arrendadora del Centro',
  gastoRecurrenteId: null,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('ExpenseSchema', () => {
  it('accepts a well-formed Expense with proveedor', () => {
    expect(() => ExpenseSchema.parse(validExpense)).not.toThrow();
  });

  it('accepts an Expense with null proveedor', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, proveedor: null })).not.toThrow();
  });

  it('accepts an Expense tied to a recurring template', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, gastoRecurrenteId: REC_ID })).not.toThrow();
  });

  it('rejects an unknown categoria value', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, categoria: 'Internet' })).toThrow();
  });

  it('rejects a missing monto', () => {
    const { monto: _m, ...rest } = validExpense;
    expect(() => ExpenseSchema.parse(rest)).toThrow();
  });

  it('rejects a float monto', () => {
    expect(() =>
      ExpenseSchema.parse({ ...validExpense, monto: 1200.5 as unknown as bigint }),
    ).toThrow();
  });

  it('rejects a malformed gastoRecurrenteId', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, gastoRecurrenteId: 'nope' })).toThrow();
  });

  it('rejects an empty concepto', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, concepto: '' })).toThrow();
  });
});

describe('NewExpenseSchema', () => {
  it('accepts a minimal input', () => {
    expect(() =>
      NewExpenseSchema.parse({
        fecha: '2026-04-23',
        concepto: 'Luz del mes',
        categoria: 'Servicios',
        monto: 95_000n,
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('accepts an input with optional gastoRecurrenteId', () => {
    expect(() =>
      NewExpenseSchema.parse({
        fecha: '2026-04-23',
        concepto: 'Renta',
        categoria: 'Renta',
        monto: 1_200_000n,
        gastoRecurrenteId: REC_ID,
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });
});

describe('ExpenseCategoryEnum', () => {
  it('enumerates the ten EGRESO_CAT values', () => {
    expect(ExpenseCategoryEnum.options).toEqual([
      'Materia Prima',
      'Inventario',
      'Nómina',
      'Renta',
      'Servicios',
      'Publicidad',
      'Mantenimiento',
      'Impuestos',
      'Logística',
      'Otro',
    ]);
  });
});
