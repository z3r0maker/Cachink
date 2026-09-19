/**
 * composeFlujoEfectivo tests (Slice 3 C14).
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryClientPaymentsRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  makeNewClientPayment,
  makeNewExpense,
  makeNewSale,
  makeNewTicket,
} from '@xangarro/testing';
import type { BusinessId, DeviceId, IsoDate, ClientId } from '@xangarro/domain';
import { composeFlujoEfectivo } from '../../src/hooks/use-flujo-efectivo';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const APR_01 = '2026-04-01' as IsoDate;
const APR_30 = '2026-04-30' as IsoDate;

function repos(): {
  tickets: InMemoryTicketsRepository;
  sales: InMemorySalesRepository;
  expenses: InMemoryExpensesRepository;
  payments: InMemoryClientPaymentsRepository;
} {
  return {
    tickets: new InMemoryTicketsRepository(DEV),
    sales: new InMemorySalesRepository(DEV),
    expenses: new InMemoryExpensesRepository(DEV),
    payments: new InMemoryClientPaymentsRepository(DEV),
  };
}

/** A one-line ticket of `metodo` worth `monto`. */
async function seedVenta(
  r: ReturnType<typeof repos>,
  metodo: 'Efectivo' | 'Transferencia' | 'Crédito',
  monto: bigint,
): Promise<void> {
  const ticket = await r.tickets.create(makeNewTicket({ fecha: APR_01, businessId: BIZ, metodo }));
  await r.sales.create(makeNewSale({ fecha: APR_01, businessId: BIZ, monto, ticketId: ticket.id }));
}

describe('composeFlujoEfectivo', () => {
  it('counts ventas in cash methods and excludes Crédito from operación', async () => {
    const r = repos();
    await seedVenta(r, 'Efectivo', 30_000n);
    await seedVenta(r, 'Transferencia', 20_000n);
    // Crédito ticket — not cash-in until a pago lands.
    await seedVenta(r, 'Crédito', 99_000n);
    const flujo = await composeFlujoEfectivo(r.tickets, r.sales, r.expenses, r.payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.operacion).toBe(50_000n);
  });

  it('includes Crédito pagos in operación', async () => {
    const r = repos();
    await r.payments.create(
      makeNewClientPayment({
        clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7CKJ' as ClientId,
        businessId: BIZ,
        fecha: APR_01,
        montoCentavos: 40_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(r.tickets, r.sales, r.expenses, r.payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.operacion).toBe(40_000n);
  });

  it('routes Inventario egresos to inversión and others to operación', async () => {
    const r = repos();
    await r.expenses.create(
      makeNewExpense({
        fecha: APR_01,
        businessId: BIZ,
        categoria: 'Inventario',
        monto: 10_000n,
      }),
    );
    await r.expenses.create(
      makeNewExpense({
        fecha: APR_01,
        businessId: BIZ,
        categoria: 'Renta',
        monto: 5_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(r.tickets, r.sales, r.expenses, r.payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.operacion).toBe(-5_000n);
    expect(flujo.inversion).toBe(-10_000n);
    expect(flujo.total).toBe(-15_000n);
  });

  it('returns zero inversión when no Inventario egresos exist', async () => {
    const r = repos();
    await r.expenses.create(
      makeNewExpense({
        fecha: APR_01,
        businessId: BIZ,
        categoria: 'Renta',
        monto: 1_000n,
      }),
    );
    const flujo = await composeFlujoEfectivo(r.tickets, r.sales, r.expenses, r.payments, BIZ, {
      from: APR_01,
      to: APR_30,
    });
    expect(flujo.inversion).toBe(0n);
  });
});
