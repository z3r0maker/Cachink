/**
 * CancelarTicketUseCase's refusals carry a `code` (audit F-08): the caller
 * counts a wrong NIP toward the device's lockout, and only a wrong NIP. The
 * messages stay what the screens already show.
 */

import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';
import {
  InMemoryCancelacionLogsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewSale,
  makeNewTicket,
} from '../../testing/src/index.js';
import { CrearOperadorUseCase } from '../src/index.js';
import {
  CancelarTicketError,
  CancelarTicketUseCase,
  isWrongPin,
} from '../src/cancelar-ticket/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const NADIE = '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as UserId;

describe('CancelarTicketUseCase: typed refusals', () => {
  let users: InMemoryUsersRepository;
  let useCase: CancelarTicketUseCase;
  let ticketId: TicketId;
  let puede: UserId;
  let noPuede: UserId;

  beforeEach(async () => {
    const tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    const sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    useCase = new CancelarTicketUseCase(
      tickets,
      sales,
      users,
      new InMemoryProductsRepository(TEST_DEVICE_ID),
      new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID),
      new InMemoryCancelacionLogsRepository(TEST_DEVICE_ID),
    );
    const crear = new CrearOperadorUseCase(users);
    const base = { businessId: BIZ, pin: '1234', operatorLimit: 10 };
    puede = (await crear.execute({ ...base, nombre: 'Ana' })).id;
    await users.update(puede, { permissions: { canCancelSales: true } });
    noPuede = (await crear.execute({ ...base, nombre: 'Toni' })).id;
    const ticket = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', concepto: 'Venta' }),
    );
    await sales.create(makeNewSale({ businessId: BIZ, monto: 5000n, ticketId: ticket.id }));
    ticketId = ticket.id;
  });

  /** Runs the cancellation and hands back what it threw. */
  async function refusal(over: {
    userId?: UserId;
    pin?: string;
    ticketId?: TicketId;
  }): Promise<unknown> {
    try {
      await useCase.execute({
        ticketId: over.ticketId ?? ticketId,
        userId: over.userId ?? puede,
        pin: over.pin ?? '1234',
        motivo: 'x',
        businessId: BIZ,
        stockEnabled: false,
      });
    } catch (e: unknown) {
      return e;
    }
    return null;
  }

  it('goes through with the right NIP and permission', async () => {
    assert.equal(await refusal({}), null);
  });

  it('marks a wrong NIP with PIN_INCORRECTO and keeps its message', async () => {
    const e = await refusal({ pin: '9999' });
    assert.ok(e instanceof CancelarTicketError);
    assert.ok(e instanceof TypeError);
    assert.equal(e.code, 'PIN_INCORRECTO');
    assert.equal(e.message, 'PIN incorrecto');
    assert.equal(String(e), 'TypeError: PIN incorrecto');
    assert.equal(isWrongPin(e), true);
  });

  it('does not call an unknown user a wrong NIP', async () => {
    const e = await refusal({ userId: NADIE });
    assert.ok(e instanceof CancelarTicketError);
    assert.equal(e.code, 'USUARIO_NO_ENCONTRADO');
    assert.equal(e.message, 'Usuario no encontrado');
    assert.equal(isWrongPin(e), false);
  });

  it('does not call a missing permission a wrong NIP', async () => {
    const e = await refusal({ userId: noPuede });
    assert.ok(e instanceof CancelarTicketError);
    assert.equal(e.code, 'SIN_PERMISO');
    assert.equal(e.message, 'No tienes permiso para cancelar ventas');
    assert.equal(isWrongPin(e), false);
  });

  it('checks the NIP before the permission', async () => {
    const e = await refusal({ userId: noPuede, pin: '9999' });
    assert.equal(isWrongPin(e), true);
  });

  it('codes a missing ticket and a ticket cancelled twice', async () => {
    const missing = await refusal({ ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZY' as TicketId });
    assert.ok(missing instanceof CancelarTicketError);
    assert.equal(missing.code, 'VENTA_NO_ENCONTRADA');
    assert.equal(await refusal({}), null);
    const twice = await refusal({});
    assert.ok(twice instanceof CancelarTicketError);
    assert.equal(twice.code, 'VENTA_YA_CANCELADA');
    assert.equal(twice.message, 'Esta venta ya fue cancelada');
  });

  it('tells a wrong NIP by its code, not by its text', () => {
    assert.equal(isWrongPin(new TypeError('PIN incorrecto')), false);
    assert.equal(isWrongPin({ code: 'PIN_INCORRECTO' }), true);
    assert.equal(isWrongPin(null), false);
    assert.equal(isWrongPin('PIN_INCORRECTO'), false);
  });
});
