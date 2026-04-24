import { describe, expect, it } from 'vitest';
import type { Expense, Sale } from '../../src/entities/index.js';
import { CORTE_ZERO, calculateCorteDeDia } from '../../src/financials/index.js';

const AUDIT = {
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BIZ',
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
    monto: 0n,
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
    concepto: 'Egreso',
    categoria: 'Renta',
    monto: 0n,
    proveedor: null,
    gastoRecurrenteId: null,
    ...AUDIT,
    ...overrides,
  } as Expense;
}

describe('calculateCorteDeDia', () => {
  it('exports a CORTE_ZERO constant for UI "no calc yet" state', () => {
    expect(CORTE_ZERO).toEqual({ esperado: 0n, diferencia: 0n });
  });

  it('returns zero esperado + diferencia on empty day with zero prior', () => {
    const result = calculateCorteDeDia({
      ventasHoy: [],
      egresosHoy: [],
      saldoCierreAnterior: 0n,
      efectivoContado: 0n,
    });
    expect(result).toEqual({ esperado: 0n, diferencia: 0n });
  });

  it('ventas efectivo accumulate into esperado; non-Efectivo ignored', () => {
    const ventasHoy = [
      makeSale({ metodo: 'Efectivo', monto: 10_000n }),
      makeSale({ metodo: 'Efectivo', monto: 5_000n }),
      makeSale({ metodo: 'Transferencia', monto: 99_999n }),
      makeSale({ metodo: 'Crédito', estadoPago: 'pendiente', monto: 99_999n }),
    ];
    const result = calculateCorteDeDia({
      ventasHoy,
      egresosHoy: [],
      saldoCierreAnterior: 0n,
      efectivoContado: 15_000n,
    });
    expect(result.esperado).toBe(15_000n);
    expect(result.diferencia).toBe(0n);
  });

  it('saldoCierreAnterior adds to esperado', () => {
    const result = calculateCorteDeDia({
      ventasHoy: [makeSale({ metodo: 'Efectivo', monto: 5_000n })],
      egresosHoy: [],
      saldoCierreAnterior: 2_000n,
      efectivoContado: 7_000n,
    });
    expect(result.esperado).toBe(7_000n);
    expect(result.diferencia).toBe(0n);
  });

  it('egresos (all categorias) reduce esperado', () => {
    const result = calculateCorteDeDia({
      ventasHoy: [makeSale({ metodo: 'Efectivo', monto: 10_000n })],
      egresosHoy: [
        makeExpense({ categoria: 'Renta', monto: 2_000n }),
        makeExpense({ categoria: 'Nómina', monto: 1_500n }),
      ],
      saldoCierreAnterior: 0n,
      efectivoContado: 6_500n,
    });
    expect(result.esperado).toBe(6_500n);
    expect(result.diferencia).toBe(0n);
  });

  it('diferencia is positive when contado > esperado', () => {
    const result = calculateCorteDeDia({
      ventasHoy: [makeSale({ metodo: 'Efectivo', monto: 1_000n })],
      egresosHoy: [],
      saldoCierreAnterior: 0n,
      efectivoContado: 1_100n,
    });
    expect(result.diferencia).toBe(100n);
  });

  it('diferencia is negative when contado < esperado', () => {
    const result = calculateCorteDeDia({
      ventasHoy: [makeSale({ metodo: 'Efectivo', monto: 1_000n })],
      egresosHoy: [],
      saldoCierreAnterior: 0n,
      efectivoContado: 900n,
    });
    expect(result.diferencia).toBe(-100n);
  });
});
