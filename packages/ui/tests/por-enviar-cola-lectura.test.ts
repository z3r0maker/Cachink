/**
 * `leerCola` (M-09): the outbox's rows grouped the way the operator
 * captured them, over the in-memory repositories — a ticket with its lines
 * (and the cancelación that touches it) is one «Venta», the inventory
 * ledger folds into one line, a gasto and an abono keep their names, and
 * what cannot be read is skipped, never guessed.
 */
import { describe, expect, it } from 'vitest';
import type { BusinessId } from '@xangarro/domain';
import {
  InMemoryCajaMovimientosRepository,
  InMemoryCajaTurnosRepository,
  InMemoryCancelacionLogsRepository,
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  InMemoryExpensesRepository,
  InMemoryProductsRepository,
  InMemoryRespuestasOperadorRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  makeNewClient,
  makeNewClientPayment,
  makeNewExpense,
  makeNewSale,
  makeNewTicket,
  TEST_DEVICE_ID,
} from '@xangarro/testing';
import { leerCola } from '../src/screens/Pendientes/cola-lectura';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function repos() {
  return {
    tickets: new InMemoryTicketsRepository(TEST_DEVICE_ID),
    sales: new InMemorySalesRepository(TEST_DEVICE_ID),
    expenses: new InMemoryExpensesRepository(TEST_DEVICE_ID),
    clientPayments: new InMemoryClientPaymentsRepository(TEST_DEVICE_ID),
    clients: new InMemoryClientsRepository(TEST_DEVICE_ID),
    cajaMovimientos: new InMemoryCajaMovimientosRepository(TEST_DEVICE_ID),
    cajaTurnos: new InMemoryCajaTurnosRepository(TEST_DEVICE_ID),
    cancelacionLogs: new InMemoryCancelacionLogsRepository(TEST_DEVICE_ID),
    products: new InMemoryProductsRepository(TEST_DEVICE_ID),
    respuestas: new InMemoryRespuestasOperadorRepository(TEST_DEVICE_ID),
  };
}

async function cajaConVenta() {
  const r = repos();
  const t = await r.tickets.create(
    makeNewTicket({ businessId: BIZ, folio: 412, hora: '14:52', metodo: 'Efectivo' }),
  );
  await r.sales.create(
    makeNewSale({
      businessId: BIZ,
      ticketId: t.id,
      concepto: 'pastor',
      cantidad: 3,
      monto: 100_00n,
    }),
  );
  await r.sales.create(
    makeNewSale({
      businessId: BIZ,
      ticketId: t.id,
      concepto: 'gringa',
      cantidad: 1,
      monto: 60_00n,
    }),
  );
  return { r, t };
}

describe('leerCola · lo capturado', () => {
  it('a ticket, its lines and its cancelación are one venta with the total', async () => {
    const { r, t } = await cajaConVenta();
    await r.tickets.cancel(t.id, 'Error de captura', 'u-1');
    const cola = await leerCola(r, [
      { tableName: 'tickets', rowId: t.id, retrying: false },
      { tableName: 'sales', rowId: 's-x', retrying: false },
      { tableName: 'cancelacion_logs', rowId: 'cualquiera', retrying: false },
    ]);
    expect(cola).toHaveLength(1);
    expect(cola[0]).toMatchObject({
      tipo: 'venta',
      titulo: 'Venta V-0412 · cancelada',
      detalle: '3 pastor · 1 gringa · efectivo',
      monto: 160_00n,
      hora: '14:52',
    });
  });

  it('a gasto and an abono keep their concept and their client', async () => {
    const r = repos();
    const g = await r.expenses.create(
      makeNewExpense({ businessId: BIZ, concepto: 'Gas', monto: 620_00n }),
    );
    const clienta = await r.clients.create(makeNewClient({ nombre: 'Chuy', businessId: BIZ }));
    const p = await r.clientPayments.create(
      makeNewClientPayment({
        businessId: BIZ,
        clienteId: clienta.id,
        montoCentavos: 200_00n,
        metodo: 'Efectivo',
      }),
    );
    const cola = await leerCola(r, [
      { tableName: 'expenses', rowId: g.id, retrying: false },
      { tableName: 'client_payments', rowId: p.id, retrying: false },
    ]);
    expect(cola.map((x) => [x.titulo, x.detalle, x.monto])).toEqual([
      ['Gasto · Gas', 'Gasto de caja chica', 620_00n],
      ['Abono · Chuy', 'En efectivo', 200_00n],
    ]);
  });

  it('the inventory ledger folds into one line, whatever its size', async () => {
    const { r } = await cajaConVenta();
    const cola = await leerCola(r, [
      { tableName: 'inventory_movements', rowId: 'i-1', retrying: false },
      { tableName: 'inventory_movements', rowId: 'i-2', retrying: false },
      { tableName: 'tickets', rowId: 'no-existe', retrying: false },
    ]);
    expect(cola).toHaveLength(1);
    expect(cola[0]?.titulo).toBe('Movimientos de inventario');
  });

  it('a row that cannot be read is skipped, never invented', async () => {
    const r = repos();
    const cola = await leerCola(r, [
      { tableName: 'expenses', rowId: 'no-existe', retrying: false },
      { tableName: 'day_closes', rowId: 'dc-1', retrying: false },
    ]);
    expect(cola).toHaveLength(1);
    expect(cola[0]?.titulo).toBe('Corte del día');
  });
});
