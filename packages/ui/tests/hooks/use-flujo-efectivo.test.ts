/**
 * composeFlujoEfectivo tests (Slice 3 C14).
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryClientPaymentsRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  makeNewClientPayment,
  makeNewExpense,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate, SaleId } from '@cachink/domain';
import { composeFlujoEfectivo } from '../../src/hooks/use-flujo-efectivo';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const APR_01 = '2026-04-01' as IsoDate;
const APR_30 = '2026-04-30' as IsoDate;

function repos(): {
  sales: InMemorySalesRepository;
  expenses: InMemoryExpensesRepository;
  payments: InMemoryClientPaymentsRepository;
} {
  return {
    sales: new InMemorySalesRepository(DEV),
    expenses: new InMemoryExpensesRepository(DEV),
    payments: new InMemoryClientPaymentsRepository(DEV),
  };
}

describe('composeFlujoEfectivo', () => {
  it('counts ventas in cash methods and excludes Crédito from operación', async () => {
    const { sales, expenses, payments } = repos();
    await sales.create(
      makeNewSale({
        fecha: APR_01,
        businessId: BIZ,
        metodo: 'Efectivo',
        monto: 30_000n,
      }),
    );
    await sales.create(
      makeNewSale({
        fecha: APR_01,
        businessId: BIZ,
        metodo: 'Transferencia',
        monto: 20_000n,
      }),
    );
    // Crédito venta — not cash-in until a pago lands.
    await sales.create(
      makeNewSale({
        fecha: APR_01,
        businessId: BIZ,
        metodo: 'Crédito',
        monto: 99_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(sales, expenses, payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.operacion).toBe(50_000n);
  });

  it('includes Crédito pagos in operación', async () => {
    const { sales, expenses, payments } = repos();
    await payments.create(
      makeNewClientPayment({
        ventaId: '01JPHKFAKE0000000000000001' as SaleId,
        businessId: BIZ,
        fecha: APR_01,
        montoCentavos: 40_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(sales, expenses, payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.operacion).toBe(40_000n);
  });

  it('routes Inventario egresos to inversión and others to operación', async () => {
    const { sales, expenses, payments } = repos();
    await expenses.create(
      makeNewExpense({
        fecha: APR_01,
        businessId: BIZ,
        categoria: 'Inventario',
        monto: 10_000n,
      }),
    );
    await expenses.create(
      makeNewExpense({
        fecha: APR_01,
        businessId: BIZ,
        categoria: 'Renta',
        monto: 5_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(sales, expenses, payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.operacion).toBe(-5_000n);
    expect(flujo.inversion).toBe(-10_000n);
    expect(flujo.total).toBe(-15_000n);
  });

  it('returns zero inversión when no Inventario egresos exist', async () => {
    const { sales, expenses, payments } = repos();
    await expenses.create(
      makeNewExpense({
        fecha: APR_01,
        businessId: BIZ,
        categoria: 'Renta',
        monto: 1_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(sales, expenses, payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.inversion).toBe(0n);
  });
});
