import { describe, expect, it } from 'vitest';
import type { Expense, Sale } from '../../src/entities/index.js';
import { calculateEstadoDeResultados } from '../../src/financials/index.js';

/**
 * Fixture builder local to this test file — avoids pulling @cachink/testing
 * from a domain test (domain must not depend on testing at runtime).
 */

const AUDIT = {
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
  createdAt: '2026-04-23T12:00:00.000Z',
  updatedAt: '2026-04-23T12:00:00.000Z',
  deletedAt: null,
} as const;

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
    fecha: '2026-04-23',
    concepto: 'Taco',
    categoria: 'Producto',
    monto: 100n,
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    ...AUDIT,
    ...overrides,
  } as Sale;
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7E01',
    fecha: '2026-04-23',
    concepto: 'Renta',
    categoria: 'Renta',
    monto: 100n,
    proveedor: null,
    gastoRecurrenteId: null,
    ...AUDIT,
    ...overrides,
  } as Expense;
}

describe('calculateEstadoDeResultados', () => {
  it('returns all zeros on empty inputs', () => {
    const result = calculateEstadoDeResultados({ ventas: [], egresos: [], isrTasa: 0.3 });
    expect(result).toEqual({
      ingresos: 0n,
      costoDeVentas: 0n,
      utilidadBruta: 0n,
      gastosOperativos: 0n,
      utilidadOperativa: 0n,
      isr: 0n,
      utilidadNeta: 0n,
    });
  });

  it('sales only → utilidadBruta equals ingresos', () => {
    const ventas = [makeSale({ monto: 10_000n }), makeSale({ monto: 5_000n })];
    const result = calculateEstadoDeResultados({ ventas, egresos: [], isrTasa: 0.3 });
    expect(result.ingresos).toBe(15_000n);
    expect(result.utilidadBruta).toBe(15_000n);
    expect(result.costoDeVentas).toBe(0n);
  });

  it('splits egresos into costoDeVentas vs gastosOperativos by category', () => {
    const egresos = [
      makeExpense({ categoria: 'Materia Prima', monto: 1_000n }),
      makeExpense({ categoria: 'Inventario', monto: 2_000n }),
      makeExpense({ categoria: 'Renta', monto: 3_000n }),
      makeExpense({ categoria: 'Nómina', monto: 4_000n }),
    ];
    const result = calculateEstadoDeResultados({ ventas: [], egresos, isrTasa: 0 });
    expect(result.costoDeVentas).toBe(3_000n);
    expect(result.gastosOperativos).toBe(7_000n);
  });

  it('egresos only → utilidadOperativa is negative, ISR clamped to 0', () => {
    const egresos = [makeExpense({ monto: 5_000n })];
    const result = calculateEstadoDeResultados({ ventas: [], egresos, isrTasa: 0.3 });
    expect(result.utilidadOperativa).toBe(-5_000n);
    expect(result.isr).toBe(0n);
    expect(result.utilidadNeta).toBe(-5_000n);
  });

  it('applies the ISR rate to positive utilidadOperativa only', () => {
    const ventas = [makeSale({ monto: 100_000n })];
    const egresos = [makeExpense({ categoria: 'Renta', monto: 30_000n })];
    const result = calculateEstadoDeResultados({ ventas, egresos, isrTasa: 0.3 });
    expect(result.utilidadOperativa).toBe(70_000n);
    expect(result.isr).toBe(21_000n); // 70000 × 0.30
    expect(result.utilidadNeta).toBe(49_000n);
  });

  it('isrTasa=0 keeps isr at 0 even for profitable periods', () => {
    const ventas = [makeSale({ monto: 10_000n })];
    const result = calculateEstadoDeResultados({ ventas, egresos: [], isrTasa: 0 });
    expect(result.isr).toBe(0n);
    expect(result.utilidadNeta).toBe(10_000n);
  });

  it('isrTasa=1 returns 0 utilidadNeta (100% tax)', () => {
    const ventas = [makeSale({ monto: 10_000n })];
    const result = calculateEstadoDeResultados({ ventas, egresos: [], isrTasa: 1 });
    expect(result.isr).toBe(10_000n);
    expect(result.utilidadNeta).toBe(0n);
  });

  it('counts Crédito ventas as ingresos (accrual basis)', () => {
    const ventas = [
      makeSale({ metodo: 'Crédito', estadoPago: 'pendiente', monto: 10_000n }),
      makeSale({ metodo: 'Efectivo', estadoPago: 'pagado', monto: 5_000n }),
    ];
    const result = calculateEstadoDeResultados({ ventas, egresos: [], isrTasa: 0.3 });
    expect(result.ingresos).toBe(15_000n);
  });

  it('realistic mixed month produces the expected bottom line', () => {
    const ventas = [
      makeSale({ monto: 50_000n }),
      makeSale({ monto: 75_000n }),
      makeSale({ monto: 25_000n, metodo: 'Crédito', estadoPago: 'pendiente' }),
    ];
    const egresos = [
      makeExpense({ categoria: 'Materia Prima', monto: 20_000n }),
      makeExpense({ categoria: 'Inventario', monto: 10_000n }),
      makeExpense({ categoria: 'Renta', monto: 30_000n }),
      makeExpense({ categoria: 'Nómina', monto: 35_000n }),
      makeExpense({ categoria: 'Servicios', monto: 5_000n }),
    ];
    const result = calculateEstadoDeResultados({ ventas, egresos, isrTasa: 0.3 });
    expect(result.ingresos).toBe(150_000n);
    expect(result.costoDeVentas).toBe(30_000n);
    expect(result.utilidadBruta).toBe(120_000n);
    expect(result.gastosOperativos).toBe(70_000n);
    expect(result.utilidadOperativa).toBe(50_000n);
    expect(result.isr).toBe(15_000n); // 50000 × 0.30
    expect(result.utilidadNeta).toBe(35_000n);
  });

  it('treats refunds as negative-monto sales and reduces ingresos', () => {
    const ventas = [makeSale({ monto: 10_000n }), makeSale({ monto: -3_000n })];
    const result = calculateEstadoDeResultados({ ventas, egresos: [], isrTasa: 0.3 });
    expect(result.ingresos).toBe(7_000n);
  });

  it('rejects isrTasa outside [0, 1]', () => {
    expect(() =>
      calculateEstadoDeResultados({ ventas: [], egresos: [], isrTasa: 1.5 }),
    ).toThrow(/isrTasa/);
    expect(() =>
      calculateEstadoDeResultados({ ventas: [], egresos: [], isrTasa: -0.1 }),
    ).toThrow(/isrTasa/);
  });
});
