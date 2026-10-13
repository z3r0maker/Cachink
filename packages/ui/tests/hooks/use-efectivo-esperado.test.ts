/**
 * composeEfectivoEsperado tests. Pure composition — no QueryClient, no
 * React tree. Uses in-memory repos directly; ventas are tickets + lines
 * (ADR-073).
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  makeNewDayClose,
  makeNewSale,
  makeNewTicket,
} from '@xangarro/testing';
import type { BusinessId, DeviceId, IsoDate } from '@xangarro/domain';
import { composeEfectivoEsperado } from '../../src/hooks/use-efectivo-esperado';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const TODAY = '2026-04-24' as IsoDate;

/** A one-line ticket of `metodo` worth `monto`. */
async function seedVenta(
  tickets: InMemoryTicketsRepository,
  sales: InMemorySalesRepository,
  metodo: 'Efectivo' | 'Tarjeta',
  monto: bigint,
  fecha: IsoDate = TODAY,
): Promise<void> {
  const ticket = await tickets.create(makeNewTicket({ businessId: BIZ, metodo, fecha }));
  await sales.create(makeNewSale({ businessId: BIZ, monto, fecha, ticketId: ticket.id }));
}

describe('composeEfectivoEsperado', () => {
  it('returns ZERO when there are no ventas, egresos, or prior corte', async () => {
    const tickets = new InMemoryTicketsRepository();
    const sales = new InMemorySalesRepository();
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const result = await composeEfectivoEsperado(tickets, sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(0n);
  });

  it('sums today Efectivo tickets minus egresos', async () => {
    const tickets = new InMemoryTicketsRepository();
    const sales = new InMemorySalesRepository();
    await seedVenta(tickets, sales, 'Efectivo', 50_000n);
    // Non-efectivo tickets don't count toward esperado.
    await seedVenta(tickets, sales, 'Tarjeta', 100_000n);
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const result = await composeEfectivoEsperado(tickets, sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(50_000n);
  });

  it('adds the saldoCierreAnterior from the latest prior corte', async () => {
    const tickets = new InMemoryTicketsRepository();
    const sales = new InMemorySalesRepository();
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    await closes.create(
      makeNewDayClose({
        fecha: '2026-04-23' as IsoDate,
        businessId: BIZ,
        efectivoEsperadoCentavos: 100_000n,
        efectivoContadoCentavos: 100_000n,
      }),
    );
    const result = await composeEfectivoEsperado(tickets, sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(100_000n);
  });

  it('scopes tickets to the requested date (older days are excluded)', async () => {
    const tickets = new InMemoryTicketsRepository();
    const sales = new InMemorySalesRepository();
    await seedVenta(tickets, sales, 'Efectivo', 99_999n, '2026-04-23' as IsoDate);
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const result = await composeEfectivoEsperado(tickets, sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(0n);
  });
});
