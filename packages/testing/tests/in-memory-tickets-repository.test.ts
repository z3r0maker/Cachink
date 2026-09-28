import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { InMemoryTicketsRepository, TEST_DEVICE_ID } from '../src/index.js';

/**
 * The tickets in-memory twin: the contract covers the happy paths; these
 * cover the edges a store's own semantics decide — folios per device,
 * date-range boundaries, pending vs crédito by client, and the cancel and
 * delete state machine (a cancelled ticket cannot cancel again; a deleted
 * one is invisible everywhere but still holds its folio number).
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as never;
const CLIENTE = '01HZ8XQN9GZJXV8AKQ5X0C7CLI' as never;

function nuevo(over: Record<string, unknown> = {}) {
  return {
    folio: 1,
    fecha: '2026-09-28',
    hora: '14:58',
    concepto: 'Tacos',
    metodo: 'Efectivo' as const,
    estadoPago: 'pagado' as const,
    efectivoRecibidoCentavos: 500_00n,
    cambioCentavos: 50_00n,
    businessId: BIZ,
    ...over,
  };
}

describe('InMemoryTicketsRepository · edges', () => {
  it('folios count this device only, one past the highest', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    assert.equal(await r.nextFolio(BIZ), 1);
    await r.create(nuevo({ folio: 7 }));
    await r.create(nuevo({ folio: 3 }));
    assert.equal(await r.nextFolio(BIZ), 8);
  });

  it('findByDate keeps the day, the business and the living, newest first', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    const a = await r.create(nuevo({ concepto: 'primero' }));
    await r.create(nuevo({ folio: 2, concepto: 'segundo' }));
    await r.create(nuevo({ folio: 3, fecha: '2026-09-27' }));
    await r.delete(a.id as never);
    const delDia = await r.findByDate('2026-09-28', BIZ);
    assert.deepEqual(
      delDia.map((t) => t.concepto),
      ['segundo'],
    );
  });

  it('findByDateRange includes both ends, newest date first', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    await r.create(nuevo({ folio: 1, fecha: '2026-09-26' }));
    await r.create(nuevo({ folio: 2, fecha: '2026-09-28' }));
    await r.create(nuevo({ folio: 3, fecha: '2026-09-27' }));
    await r.create(nuevo({ folio: 4, fecha: '2026-10-01' }));
    const rango = await r.findByDateRange('2026-09-26', '2026-09-28', BIZ);
    assert.deepEqual(
      rango.map((t) => t.fecha),
      ['2026-09-28', '2026-09-27', '2026-09-26'],
    );
  });

  it('pending by client: pendiente or parcial, oldest first, never the paid or the deleted', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    await r.create(
      nuevo({ folio: 1, clienteId: CLIENTE, estadoPago: 'pagado', metodo: 'Crédito' }),
    );
    await r.create(
      nuevo({ folio: 2, clienteId: CLIENTE, estadoPago: 'pendiente', metodo: 'Crédito' }),
    );
    await r.create(
      nuevo({ folio: 3, clienteId: CLIENTE, estadoPago: 'parcial', metodo: 'Crédito' }),
    );
    await r.create(nuevo({ folio: 4, estadoPago: 'pendiente' }));
    const borrado = await r.create(
      nuevo({ folio: 5, clienteId: CLIENTE, estadoPago: 'pendiente', metodo: 'Crédito' }),
    );
    await r.delete(borrado.id as never);
    const pendientes = await r.findPendingByClient(CLIENTE);
    assert.equal(pendientes.length, 2);
    assert.deepEqual(
      pendientes.map((t) => t.estadoPago),
      ['pendiente', 'parcial'],
    );

    // Crédito by client counts every live crédito ticket, paid or not.
    const creditos = await r.findCreditoByClient(CLIENTE);
    assert.equal(creditos.length, 3);
  });

  it('cancel stamps who, why and when — and only once', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    const t = await r.create(nuevo());
    const cancelado = await r.cancel(t.id as never, 'se fue sin pagar', 'u-1');
    assert.equal(cancelado?.cancelMotivo, 'se fue sin pagar');
    assert.equal(cancelado?.cancelledByUserId, 'u-1');
    assert.ok(cancelado?.cancelledAt !== null);

    assert.equal(await r.cancel(t.id as never, 'otra vez', 'u-1'), null);
    assert.equal(await r.cancel('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ', 'x', 'u-1'), null);
  });

  it('updatePaymentState on a missing row is silence, not an error', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    await r.updatePaymentState('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ', 'parcial');
    const t = await r.create(
      nuevo({ estadoPago: 'pendiente', metodo: 'Crédito', clienteId: CLIENTE }),
    );
    await r.updatePaymentState(t.id as never, 'pagado');
    assert.equal((await r.findById(t.id as never))?.estadoPago, 'pagado');
  });

  it('a ticket found by caja turno is the living one of that turno', async () => {
    const r = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    const turno = '01HZ8XQN9GZJXV8AKQ5X0C7TUR' as never;
    const enTurno = await r.create(nuevo({ cajaTurnoId: turno }));
    await r.create(nuevo({ folio: 2 }));
    assert.deepEqual(
      (await r.findByCajaTurno(turno)).map((t) => t.id),
      [enTurno.id],
    );
  });
});
