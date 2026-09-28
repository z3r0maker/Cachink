import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  InMemoryCajaMovimientosRepository,
  InMemoryCancelacionLogsRepository,
  InMemoryClientsRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
} from '../src/index.js';

/**
 * The in-memory twins' own semantics — the edges their contracts don't
 * reach: scoping and date-range boundaries, optional-column defaults, and
 * the not-found returns every screen branches on.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as never;
const TURNO = '01HZ8XQN9GZJXV8AKQ5X0C7TUR' as never;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7USR' as never;

describe('InMemoryCajaMovimientosRepository · edges', () => {
  it('a movimiento lands in its turno, oldest first; ranges include both ends', async () => {
    const r = new InMemoryCajaMovimientosRepository(TEST_DEVICE_ID);
    const primero = await r.create({
      turnoId: TURNO,
      tipo: 'deposito',
      montoCentavos: 200_00n,
      motivo: 'cambio',
      userId: USER,
      businessId: BIZ,
    });
    await r.create({
      turnoId: '01HZ8XQN9GZJXV8AKQ5X0C9TUR' as never,
      tipo: 'retiro',
      montoCentavos: 1n,
      motivo: 'x',
      userId: USER,
      businessId: BIZ,
    });
    const delTurno = await r.findByTurno(TURNO);
    assert.equal(delTurno.length, 1);
    assert.equal(delTurno[0]?.id, primero.id);

    const enRango = await r.findByDateRange('2026-09-28', '2026-09-28', BIZ);
    assert.equal(enRango.length, 2);
    assert.equal(await r.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never), null);
  });
});

describe('InMemoryCancelacionLogsRepository · edges', () => {
  const base = {
    ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7TK1' as never,
    cancelledByUserId: USER,
    motivo: 'se fue sin pagar',
    montoOriginalCentavos: 350_00n,
    metodoOriginal: 'Efectivo' as const,
    businessId: BIZ,
  };

  it('create carries the optional reversal facts or their defaults; the log answers by ticket', async () => {
    const r = new InMemoryCancelacionLogsRepository(TEST_DEVICE_ID);
    const minimo = await r.create(base);
    assert.equal(minimo.cashReturnedCentavos, null);
    assert.equal(minimo.stockReversed, false);
    assert.equal(minimo.cantidadDevuelta, null);
    assert.equal(minimo.productoId, null);

    const completo = await r.create({
      ...base,
      ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7TK2' as never,
      cashReturnedCentavos: 350_00n,
      stockReversed: true,
      cantidadDevuelta: 3,
      productoId: '01HZ8XQN9GZJXV8AKQ5X0C7PRD' as never,
    });
    assert.equal(completo.stockReversed, true);
    assert.equal(await r.findByTicketId('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never), null);
    assert.equal((await r.findByTicketId(base.ticketId))?.id, minimo.id);
    assert.equal((await r.findByTicketId(completo.ticketId))?.id, completo.id);
    assert.equal(await r.findById(minimo.id as never), minimo);
    assert.equal(await r.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never), null);
  });
});

describe('InMemoryExpensesRepository · edges', () => {
  const gasto = (over: Record<string, unknown> = {}) => ({
    fecha: '2026-09-28',
    concepto: 'Gas',
    categoria: 'Servicios' as const,
    monto: 400_00n,
    proveedor: 'Gasera',
    businessId: BIZ,
    ...over,
  });

  it('a gasto of the turno answers to its turno; month and category find theirs', async () => {
    const r = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    const delTurno = await r.create(gasto({ cajaTurnoId: TURNO }));
    await r.create(gasto({ concepto: 'Luz', fecha: '2026-08-30' }));
    assert.deepEqual(
      (await r.findByCajaTurno(TURNO)).map((e) => e.id),
      [delTurno.id],
    );
    assert.equal((await r.findByMonth('2026-09', BIZ)).length, 1);
    assert.equal((await r.findByMonth('2026-08', BIZ)).length, 1);
    assert.equal((await r.findByCategory('Servicios', BIZ, '2026-09-01', '2026-09-30')).length, 1);
    assert.equal(await r.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never), null);
  });

  it('a patch against a missing row is null', async () => {
    const r = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    assert.equal(
      await r.update('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, { concepto: 'x' } as never),
      null,
    );
  });
});

describe('InMemoryClientsRepository · edges', () => {
  const CLIENTE_NUEVO = { nombre: 'María', businessId: BIZ } as never;

  it('create keeps every optional column NULL unless given, then a patch carries only what it names', async () => {
    const r = new InMemoryClientsRepository(TEST_DEVICE_ID);
    const minima = await r.create(CLIENTE_NUEVO);
    assert.equal(minima.telefono, null);
    assert.equal(minima.rfc, null);
    assert.equal(minima.estadoRevision, 'aprobado');

    const completa = await r.create({
      nombre: 'Lupita',
      telefono: '55',
      email: 'l@x.mx',
      nota: 'n',
      rfc: 'XAXX010101000',
      limiteCentavos: 100n,
      plazoDias: 15,
      estadoRevision: 'pendiente',
      businessId: BIZ,
    } as never);
    assert.equal(completa.plazoDias, 15);
    assert.equal(completa.estadoRevision, 'pendiente');

    const parche = await r.update(minima.id as never, { nombre: 'María Elena' } as never);
    assert.equal(parche?.nombre, 'María Elena');
    assert.equal(parche?.telefono, null);
    assert.equal(await r.update('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, {} as never), null);
  });

  it('findByName looks inside the name, scoped to the business', async () => {
    const r = new InMemoryClientsRepository(TEST_DEVICE_ID);
    await r.create({ nombre: 'María López', businessId: BIZ } as never);
    await r.create({ nombre: 'Ana', businessId: BIZ } as never);
    assert.equal((await r.findByName('maría', BIZ)).length, 1);
    assert.equal((await r.findByName('a', BIZ)).length, 2);
  });
});

describe('InMemorySalesRepository · edges', () => {
  const venta = (over: Record<string, unknown> = {}) => ({
    ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7TK1' as never,
    fecha: '2026-09-28',
    concepto: 'Tacos',
    categoria: 'Producto',
    monto: 120_00n,
    productoId: '01HZ8XQN9GZJXV8AKQ5X0C7PRD' as never,
    businessId: BIZ,
    ...over,
  });

  it('cantidad defaults to one; ranges include both ends; the ticket finds its lines', async () => {
    const r = new InMemorySalesRepository(TEST_DEVICE_ID);
    const sinCantidad = await r.create(venta());
    assert.equal(sinCantidad.cantidad, 1);
    await r.create(
      venta({
        fecha: '2026-09-27',
        ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7TK2' as never,
        productoId: '01HZ8XQN9GZJXV8AKQ5X0C7PR2' as never,
      }),
    );
    assert.equal((await r.findByDateRange('2026-09-27', '2026-09-28', BIZ)).length, 2);
    assert.equal((await r.findByTicket(venta().ticketId)).length, 1);
    assert.equal(await r.count(BIZ), 2);
  });

  it('a patch against a deleted or missing sale is null; delete hides it everywhere', async () => {
    const r = new InMemorySalesRepository(TEST_DEVICE_ID);
    const v = await r.create(venta());
    const editada = await r.update(v.id as never, { concepto: 'x' } as never);
    assert.equal(editada?.concepto, 'x');
    await r.delete(v.id as never);
    assert.equal(await r.findById(v.id as never), null);
    assert.equal(await r.update(v.id as never, { concepto: 'y' } as never), null);
    assert.equal(await r.count(BIZ), 0);
  });

  it('frequent products count quantities since a date, most sold first', async () => {
    const r = new InMemorySalesRepository(TEST_DEVICE_ID);
    const P1 = '01HZ8XQN9GZJXV8AKQ5X0C7PR1' as never;
    const P2 = '01HZ8XQN9GZJXV8AKQ5X0C7PR2' as never;
    await r.create(venta({ productoId: P1, cantidad: 5 }));
    await r.create(venta({ productoId: P1, cantidad: 2, fecha: '2026-09-20' }));
    await r.create(venta({ productoId: P2, cantidad: 3 }));
    const frecuentes = await r.findFrequentProductoIds({
      businessId: BIZ,
      since: '2026-09-15',
      limit: 5,
    });
    assert.equal(frecuentes[0]?.productoId, P1);
    assert.equal(frecuentes[0]?.veces, 7);
    assert.equal(frecuentes[1]?.veces, 3);
  });
});
