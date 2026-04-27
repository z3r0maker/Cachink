/**
 * composeIndicadores + diasInPeriodo + sumVentasCredito tests (Slice 3 C16).
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryBusinessesRepository,
  InMemoryClientPaymentsRepository,
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  makeNewSale,
  makeSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate, SaleId } from '@cachink/domain';
import {
  composeIndicadores,
  diasInPeriodo,
  sumVentasCredito,
} from '../../src/hooks/use-indicadores';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

function makeDeps(): {
  sales: InMemorySalesRepository;
  expenses: InMemoryExpensesRepository;
  businesses: InMemoryBusinessesRepository;
  clientPayments: InMemoryClientPaymentsRepository;
  dayCloses: InMemoryDayClosesRepository;
  products: InMemoryProductsRepository;
  movements: InMemoryInventoryMovementsRepository;
} {
  return {
    sales: new InMemorySalesRepository(DEV),
    expenses: new InMemoryExpensesRepository(DEV),
    businesses: new InMemoryBusinessesRepository(DEV),
    clientPayments: new InMemoryClientPaymentsRepository(DEV),
    dayCloses: new InMemoryDayClosesRepository(DEV),
    products: new InMemoryProductsRepository(DEV),
    movements: new InMemoryInventoryMovementsRepository(DEV),
  };
}

describe('diasInPeriodo', () => {
  it('returns 1 for same-day range', () => {
    expect(diasInPeriodo('2026-04-24' as IsoDate, '2026-04-24' as IsoDate)).toBe(1);
  });

  it('returns 30 for a 30-day window', () => {
    expect(diasInPeriodo('2026-04-01' as IsoDate, '2026-04-30' as IsoDate)).toBe(30);
  });
});

describe('sumVentasCredito', () => {
  it('returns 0 for empty list', () => {
    expect(sumVentasCredito([])).toBe(0n);
  });

  it('sums only Crédito ventas', () => {
    const ventas = [
      makeSale({ id: '01JPHKA000000000000000S001' as SaleId, metodo: 'Crédito', monto: 10_000n }),
      makeSale({ id: '01JPHKA000000000000000S002' as SaleId, metodo: 'Efectivo', monto: 50_000n }),
      makeSale({ id: '01JPHKA000000000000000S003' as SaleId, metodo: 'Crédito', monto: 20_000n }),
    ];
    expect(sumVentasCredito(ventas)).toBe(30_000n);
  });
});

describe('composeIndicadores', () => {
  it('returns all six KPIs (null when denominators are zero)', async () => {
    const deps = makeDeps();
    const biz = await deps.businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RESICO',
      isrTasa: 0.3,
    });
    const ind = await composeIndicadores(deps, biz.id as BusinessId, {
      from: '2026-04-01' as IsoDate,
      to: '2026-04-30' as IsoDate,
    });
    expect(ind.margenBruto).toBeNull();
    expect(ind.margenOperativo).toBeNull();
    expect(ind.margenNeto).toBeNull();
    expect(ind.razonDeLiquidez).toBeNull();
    expect(ind.rotacionInventario).toBeNull();
    expect(ind.diasPromedioCobranza).toBeNull();
  });

  it('computes positive margins when ingresos > 0 and utilidad > 0', async () => {
    const deps = makeDeps();
    const biz = await deps.businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RESICO',
      isrTasa: 0,
    });
    await deps.sales.create(
      makeNewSale({
        fecha: '2026-04-10' as IsoDate,
        businessId: biz.id,
        metodo: 'Efectivo',
        monto: 100_000n,
      }),
    );
    const ind = await composeIndicadores(deps, biz.id as BusinessId, {
      from: '2026-04-01' as IsoDate,
      to: '2026-04-30' as IsoDate,
    });
    expect(ind.margenBruto).toBe(1); // no costo de ventas
    expect(ind.margenOperativo).toBe(1);
    expect(ind.margenNeto).toBe(1);
  });

  it('diasPromedioCobranza remains null when no Crédito ventas exist', async () => {
    const deps = makeDeps();
    const biz = await deps.businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RESICO',
      isrTasa: 0,
    });
    await deps.sales.create(
      makeNewSale({
        fecha: '2026-04-10' as IsoDate,
        businessId: biz.id,
        metodo: 'Efectivo',
        monto: 100_000n,
      }),
    );
    const ind = await composeIndicadores(deps, biz.id as BusinessId, {
      from: '2026-04-01' as IsoDate,
      to: '2026-04-30' as IsoDate,
    });
    expect(ind.diasPromedioCobranza).toBeNull();
  });
});
