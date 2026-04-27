/**
 * composeBalanceGeneral tests (Slice 3 C12).
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryClientPaymentsRepository,
  InMemoryDayClosesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  makeNewClientPayment,
  makeNewDayClose,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate, ProductId, SaleId } from '@cachink/domain';
import { composeBalanceGeneral } from '../../src/hooks/use-balance-general';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const APR_01 = '2026-04-01' as IsoDate;
const APR_30 = '2026-04-30' as IsoDate;

function buildDeps(): {
  sales: InMemorySalesRepository;
  clientPayments: InMemoryClientPaymentsRepository;
  dayCloses: InMemoryDayClosesRepository;
  products: InMemoryProductsRepository;
  movements: InMemoryInventoryMovementsRepository;
} {
  return {
    sales: new InMemorySalesRepository(DEV),
    clientPayments: new InMemoryClientPaymentsRepository(DEV),
    dayCloses: new InMemoryDayClosesRepository(DEV),
    products: new InMemoryProductsRepository(DEV),
    movements: new InMemoryInventoryMovementsRepository(DEV),
  };
}

describe('composeBalanceGeneral', () => {
  it('returns zero-everything for an empty period', async () => {
    const deps = buildDeps();
    const bg = await composeBalanceGeneral(deps, BIZ, { from: APR_01, to: APR_30 }, 0n);
    expect(bg.activo.total).toBe(0n);
    expect(bg.pasivo.total).toBe(0n);
    expect(bg.capital.total).toBe(0n);
  });

  it('sources efectivo from the latest corte in the period', async () => {
    const deps = buildDeps();
    await deps.dayCloses.create(
      makeNewDayClose({
        fecha: APR_01,
        businessId: BIZ,
        efectivoContadoCentavos: 100_000n,
      }),
    );
    await deps.dayCloses.create(
      makeNewDayClose({
        fecha: APR_30,
        businessId: BIZ,
        efectivoContadoCentavos: 150_000n,
      }),
    );
    const bg = await composeBalanceGeneral(deps, BIZ, { from: APR_01, to: APR_30 }, 0n);
    // Both cortes are for same device; the latestCorteCash helper
    // keeps the latest per (fecha, device) pair, so we sum both.
    expect(bg.activo.efectivo).toBe(250_000n);
  });

  it('computes cuentasPorCobrar from pending Crédito ventas minus pagos', async () => {
    const deps = buildDeps();
    const venta = await deps.sales.create(
      makeNewSale({
        fecha: APR_01,
        businessId: BIZ,
        metodo: 'Crédito',
        monto: 100_000n,
      }),
    );
    await deps.clientPayments.create(
      makeNewClientPayment({
        ventaId: venta.id as SaleId,
        businessId: BIZ,
        fecha: APR_01,
        montoCentavos: 30_000n,
      }),
    );
    const bg = await composeBalanceGeneral(deps, BIZ, { from: APR_01, to: APR_30 }, 0n);
    expect(bg.activo.cuentasPorCobrar).toBe(70_000n);
  });

  it('pasivosManuales defaults to 0n (Phase 1 has no invoice scanning)', async () => {
    const deps = buildDeps();
    const bg = await composeBalanceGeneral(deps, BIZ, { from: APR_01, to: APR_30 }, 50_000n);
    expect(bg.pasivo.total).toBe(0n);
    expect(bg.capital.utilidadDelPeriodo).toBe(50_000n);
    expect(bg.capital.total).toBe(50_000n);
  });

  it('threads utilidadDelPeriodo through to capital', async () => {
    const deps = buildDeps();
    const bg = await composeBalanceGeneral(deps, BIZ, { from: APR_01, to: APR_30 }, -12_345n);
    expect(bg.capital.utilidadDelPeriodo).toBe(-12_345n);
  });

  it('inventarios sums costoUnit × stock across productos (current snapshot)', async () => {
    const deps = buildDeps();
    const prod = await deps.products.create({
      nombre: 'Tortilla',
      categoria: 'Producto Terminado',
      costoUnitCentavos: 500n,
      unidad: 'pza',
      umbralStockBajo: 3,
      businessId: BIZ,
    });
    await deps.movements.create({
      productoId: prod.id as ProductId,
      fecha: APR_01,
      tipo: 'entrada',
      cantidad: 10,
      costoUnitCentavos: 500n,
      motivo: 'Compra a proveedor',
      businessId: BIZ,
    });
    const bg = await composeBalanceGeneral(deps, BIZ, { from: APR_01, to: APR_30 }, 0n);
    expect(bg.activo.inventarios).toBe(10n * 500n);
  });
});
