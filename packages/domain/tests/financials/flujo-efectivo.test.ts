import { describe, expect, it } from 'vitest';
import type { ClientPayment, Expense, Sale } from '../../src/entities/index.js';
import { calculateFlujoDeEfectivo } from '../../src/financials/index.js';

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

function makePago(overrides: Partial<ClientPayment> = {}): ClientPayment {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7P01',
    ventaId: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
    fecha: '2026-04-23',
    montoCentavos: 100n,
    metodo: 'Transferencia',
    nota: null,
    ...AUDIT,
    ...overrides,
  } as ClientPayment;
}

describe('calculateFlujoDeEfectivo', () => {
  it('returns all zeros on empty inputs', () => {
    expect(calculateFlujoDeEfectivo({ ventas: [], egresos: [], pagosClientes: [] })).toEqual({
      operacion: 0n,
      inversion: 0n,
      total: 0n,
    });
  });

  it('cash-method ventas feed operacion directly', () => {
    const ventas = [
      makeSale({ metodo: 'Efectivo', monto: 10_000n }),
      makeSale({ metodo: 'Transferencia', monto: 5_000n }),
      makeSale({ metodo: 'Tarjeta', monto: 2_500n }),
      makeSale({ metodo: 'QR/CoDi', monto: 1_500n }),
    ];
    const result = calculateFlujoDeEfectivo({ ventas, egresos: [], pagosClientes: [] });
    expect(result.operacion).toBe(19_000n);
  });

  it('Crédito ventas do NOT count as cash-in', () => {
    const ventas = [
      makeSale({ metodo: 'Crédito', estadoPago: 'pendiente', monto: 10_000n }),
    ];
    const result = calculateFlujoDeEfectivo({ ventas, egresos: [], pagosClientes: [] });
    expect(result.operacion).toBe(0n);
  });

  it('pagos against Crédito ventas count as cash-in', () => {
    const pagos = [makePago({ montoCentavos: 3_000n }), makePago({ montoCentavos: 2_000n })];
    const result = calculateFlujoDeEfectivo({
      ventas: [],
      egresos: [],
      pagosClientes: pagos,
    });
    expect(result.operacion).toBe(5_000n);
  });

  it('egresos categoria=Inventario go into inversion (negative), others reduce operacion', () => {
    const egresos = [
      makeExpense({ categoria: 'Renta', monto: 1_000n }),
      makeExpense({ categoria: 'Nómina', monto: 2_000n }),
      makeExpense({ categoria: 'Inventario', monto: 5_000n }),
    ];
    const result = calculateFlujoDeEfectivo({ ventas: [], egresos, pagosClientes: [] });
    expect(result.operacion).toBe(-3_000n);
    expect(result.inversion).toBe(-5_000n);
    expect(result.total).toBe(-8_000n);
  });

  it('Materia Prima stays in operacion (CLAUDE.md §10 — Inventario is the only capex category)', () => {
    const egresos = [makeExpense({ categoria: 'Materia Prima', monto: 4_000n })];
    const result = calculateFlujoDeEfectivo({ ventas: [], egresos, pagosClientes: [] });
    expect(result.operacion).toBe(-4_000n);
    expect(result.inversion).toBe(0n);
  });

  it('mixed realistic day', () => {
    const ventas = [
      makeSale({ metodo: 'Efectivo', monto: 20_000n }),
      makeSale({ metodo: 'Crédito', estadoPago: 'pendiente', monto: 10_000n }),
    ];
    const pagos = [makePago({ montoCentavos: 5_000n })];
    const egresos = [
      makeExpense({ categoria: 'Renta', monto: 3_000n }),
      makeExpense({ categoria: 'Inventario', monto: 8_000n }),
    ];
    const result = calculateFlujoDeEfectivo({ ventas, egresos, pagosClientes: pagos });
    // operacion = 20000 (cash) + 5000 (pago) − 3000 (renta) = 22000
    expect(result.operacion).toBe(22_000n);
    // inversion = −8000
    expect(result.inversion).toBe(-8_000n);
    expect(result.total).toBe(14_000n);
  });

  it('handles refund ventas (negative monto) correctly', () => {
    const ventas = [
      makeSale({ metodo: 'Efectivo', monto: 10_000n }),
      makeSale({ metodo: 'Efectivo', monto: -3_000n }),
    ];
    const result = calculateFlujoDeEfectivo({ ventas, egresos: [], pagosClientes: [] });
    expect(result.operacion).toBe(7_000n);
  });
});
