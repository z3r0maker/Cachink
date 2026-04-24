import { describe, expect, it } from 'vitest';
import type { ClientPayment, DayClose, Sale } from '../../src/entities/index.js';
import { calculateBalanceGeneral } from '../../src/financials/index.js';

const AUDIT = {
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
  createdAt: '2026-04-23T12:00:00.000Z',
  updatedAt: '2026-04-23T12:00:00.000Z',
  deletedAt: null,
} as const;

function makeCorte(overrides: Partial<DayClose> = {}): DayClose {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7C01',
    fecha: '2026-04-23',
    efectivoEsperadoCentavos: 0n,
    efectivoContadoCentavos: 100_000n,
    diferenciaCentavos: 100_000n,
    explicacion: null,
    cerradoPor: 'Operativo',
    ...AUDIT,
    ...overrides,
  } as DayClose;
}

function makeCreditSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
    fecha: '2026-04-23',
    concepto: 'Taco Crédito',
    categoria: 'Producto',
    monto: 10_000n,
    metodo: 'Crédito',
    clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7CKJ',
    estadoPago: 'pendiente',
    ...AUDIT,
    ...overrides,
  } as Sale;
}

function makePago(overrides: Partial<ClientPayment> = {}): ClientPayment {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7PAG',
    ventaId: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
    fecha: '2026-04-24',
    montoCentavos: 0n,
    metodo: 'Transferencia',
    nota: null,
    ...AUDIT,
    ...overrides,
  } as ClientPayment;
}

describe('calculateBalanceGeneral', () => {
  it('returns all zeros on empty inputs', () => {
    const result = calculateBalanceGeneral({
      cortesDelDia: [],
      inventarioStock: [],
      ventasConCredito: [],
      pagosClientes: [],
      pasivosManuales: 0n,
      utilidadDelPeriodo: 0n,
    });
    expect(result.activo.total).toBe(0n);
    expect(result.pasivo.total).toBe(0n);
    expect(result.capital.total).toBe(0n);
  });

  it('sums efectivo across the latest corte per (fecha, deviceId)', () => {
    const cortes = [
      makeCorte({ id: '01HZ8XQN9GZJXV8AKQ5X0C7C01', efectivoContadoCentavos: 50_000n }),
      makeCorte({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7C02',
        efectivoContadoCentavos: 60_000n,
        createdAt: '2026-04-23T20:00:00.000Z',
      }),
      makeCorte({ id: '01HZ8XQN9GZJXV8AKQ5X0C7C03', fecha: '2026-04-24', efectivoContadoCentavos: 30_000n }),
    ];
    const result = calculateBalanceGeneral({
      cortesDelDia: cortes,
      inventarioStock: [],
      ventasConCredito: [],
      pagosClientes: [],
      pasivosManuales: 0n,
      utilidadDelPeriodo: 0n,
    });
    // Latest corte on apr-23 is 60_000, plus apr-24 30_000 → 90_000
    expect(result.activo.efectivo).toBe(90_000n);
  });

  it('values inventarios as Σ(costoUnit × cantidad)', () => {
    const result = calculateBalanceGeneral({
      cortesDelDia: [],
      inventarioStock: [
        { costoUnitCentavos: 3_500n, cantidad: 10 },
        { costoUnitCentavos: 1_250n, cantidad: 4 },
      ],
      ventasConCredito: [],
      pagosClientes: [],
      pasivosManuales: 0n,
      utilidadDelPeriodo: 0n,
    });
    expect(result.activo.inventarios).toBe(40_000n); // 35_000 + 5_000
  });

  it('cuentasPorCobrar = Σ(venta.monto − pagos) per pending/parcial venta', () => {
    const ventas = [
      makeCreditSale({ id: 'A' as never, monto: 10_000n, estadoPago: 'pendiente' }),
      makeCreditSale({ id: 'B' as never, monto: 20_000n, estadoPago: 'parcial' }),
      makeCreditSale({ id: 'C' as never, monto: 30_000n, estadoPago: 'pagado' }),
    ];
    const pagos = [
      makePago({ ventaId: 'A' as never, montoCentavos: 2_000n }),
      makePago({ ventaId: 'B' as never, montoCentavos: 5_000n }),
      makePago({ ventaId: 'B' as never, montoCentavos: 5_000n }),
    ];
    const result = calculateBalanceGeneral({
      cortesDelDia: [],
      inventarioStock: [],
      ventasConCredito: ventas,
      pagosClientes: pagos,
      pasivosManuales: 0n,
      utilidadDelPeriodo: 0n,
    });
    // A: 10000 − 2000 = 8000; B: 20000 − 10000 = 10000; C: skipped.
    expect(result.activo.cuentasPorCobrar).toBe(18_000n);
  });

  it('clamps cuentasPorCobrar ≥ 0 per venta on overpayment', () => {
    const ventas = [makeCreditSale({ id: 'A' as never, monto: 10_000n, estadoPago: 'parcial' })];
    const pagos = [makePago({ ventaId: 'A' as never, montoCentavos: 15_000n })];
    const result = calculateBalanceGeneral({
      cortesDelDia: [],
      inventarioStock: [],
      ventasConCredito: ventas,
      pagosClientes: pagos,
      pasivosManuales: 0n,
      utilidadDelPeriodo: 0n,
    });
    expect(result.activo.cuentasPorCobrar).toBe(0n);
  });

  it('propagates pasivosManuales and utilidadDelPeriodo to their totals', () => {
    const result = calculateBalanceGeneral({
      cortesDelDia: [],
      inventarioStock: [],
      ventasConCredito: [],
      pagosClientes: [],
      pasivosManuales: 2_500n,
      utilidadDelPeriodo: 7_500n,
    });
    expect(result.pasivo.total).toBe(2_500n);
    expect(result.capital.utilidadDelPeriodo).toBe(7_500n);
    expect(result.capital.total).toBe(7_500n);
  });

  it('activo.total equals efectivo + inventarios + cuentasPorCobrar', () => {
    const result = calculateBalanceGeneral({
      cortesDelDia: [makeCorte({ efectivoContadoCentavos: 10_000n })],
      inventarioStock: [{ costoUnitCentavos: 500n, cantidad: 4 }],
      ventasConCredito: [makeCreditSale({ monto: 3_000n, estadoPago: 'pendiente' })],
      pagosClientes: [],
      pasivosManuales: 0n,
      utilidadDelPeriodo: 0n,
    });
    expect(result.activo.total).toBe(
      result.activo.efectivo + result.activo.inventarios + result.activo.cuentasPorCobrar,
    );
    expect(result.activo.total).toBe(15_000n);
  });
});
