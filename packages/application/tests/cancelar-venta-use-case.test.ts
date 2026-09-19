/**
 * CancelarTicketUseCase tests (ADR-073). Happy path + unhappy paths per
 * CLAUDE.md §6: PIN, permission, cash to return, stock reversal, audit log.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@xangarro/domain';
import {
  InMemoryCancelacionLogsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
  makeNewTicket,
} from '../../testing/src/index.js';
import { CrearOperadorUseCase } from '../src/index.js';
import { CancelarTicketUseCase } from '../src/cancelar-ticket/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('CancelarTicketUseCase', () => {
  let tickets: InMemoryTicketsRepository;
  let sales: InMemorySalesRepository;
  let users: InMemoryUsersRepository;
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;
  let logs: InMemoryCancelacionLogsRepository;
  let crearOperador: CrearOperadorUseCase;
  let useCase: CancelarTicketUseCase;

  let directorId: UserId;

  beforeEach(async () => {
    tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    logs = new InMemoryCancelacionLogsRepository(TEST_DEVICE_ID);

    crearOperador = new CrearOperadorUseCase(users);
    useCase = new CancelarTicketUseCase(tickets, sales, users, products, movements, logs);

    const director = await crearOperador.execute({
      businessId: BIZ,
      nombre: 'Director Test',
      pin: '1234',
      operatorLimit: 10,
    });
    // A-05: one role; cancel rights are a granted permission.
    await users.update(director.id, { permissions: { canCancelSales: true } });
    directorId = director.id;
  });

  /** A cash ticket with one line of `monto`. */
  async function seedTicket(metodo: 'Efectivo' | 'Transferencia' = 'Efectivo', monto = 5000n) {
    const ticket = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo, concepto: 'Venta' }),
    );
    const line = await sales.create(makeNewSale({ businessId: BIZ, monto, ticketId: ticket.id }));
    return { ticket, line };
  }

  it('cancels a cash ticket and returns its total as cashToReturn', async () => {
    const { ticket } = await seedTicket('Efectivo', 5000n);
    const result = await useCase.execute({
      ticketId: ticket.id,
      userId: directorId,
      pin: '1234',
      motivo: 'Cliente cambió de opinión',
      businessId: BIZ,
      stockEnabled: false,
    });
    expect(result.ticket.id).toBe(ticket.id);
    expect(result.cashToReturn).toBe(5000n);
    expect(result.stockReversed).toBe(false);
  });

  it('returns null cashToReturn for non-cash tickets', async () => {
    const { ticket } = await seedTicket('Transferencia', 3000n);
    const result = await useCase.execute({
      ticketId: ticket.id,
      userId: directorId,
      pin: '1234',
      motivo: 'Error de captura',
      businessId: BIZ,
      stockEnabled: false,
    });
    expect(result.cashToReturn).toBeNull();
  });

  it('reverses stock for each line whose product follows stock', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ, seguirStock: true }));
    const ticket = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', concepto: 'Venta' }),
    );
    await sales.create(
      makeNewSale({
        businessId: BIZ,
        monto: 1500n,
        ticketId: ticket.id,
        productoId: product.id,
        cantidad: 3,
      }),
    );
    const result = await useCase.execute({
      ticketId: ticket.id,
      userId: directorId,
      pin: '1234',
      motivo: 'Devolución',
      businessId: BIZ,
      stockEnabled: true,
    });
    expect(result.stockReversed).toBe(true);
    const entradas = await movements.findByProduct(product.id);
    expect(entradas.some((m) => m.tipo === 'salida')).toBe(false);
  });

  it('does not reverse stock when the product ignores it', async () => {
    const product = await products.create(makeNewProduct({ businessId: BIZ, seguirStock: false }));
    const ticket = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', concepto: 'Venta' }),
    );
    await sales.create(
      makeNewSale({
        businessId: BIZ,
        monto: 900n,
        ticketId: ticket.id,
        productoId: product.id,
        cantidad: 2,
      }),
    );
    const result = await useCase.execute({
      ticketId: ticket.id,
      userId: directorId,
      pin: '1234',
      motivo: 'Devolución',
      businessId: BIZ,
      stockEnabled: true,
    });
    expect(result.stockReversed).toBe(false);
  });

  it('creates one audit log for the whole ticket', async () => {
    const { ticket } = await seedTicket('Efectivo', 2000n);
    await useCase.execute({
      ticketId: ticket.id,
      userId: directorId,
      pin: '1234',
      motivo: 'Error',
      businessId: BIZ,
      stockEnabled: false,
    });
    const log = await logs.findByTicketId(ticket.id);
    expect(log).not.toBeNull();
    expect(log?.montoOriginalCentavos).toBe(2000n);
  });

  it('rejects a wrong PIN', async () => {
    const { ticket } = await seedTicket();
    await expect(
      useCase.execute({
        ticketId: ticket.id,
        userId: directorId,
        pin: '9999',
        motivo: 'x',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/PIN incorrecto/);
  });

  it('rejects an unknown user', async () => {
    const { ticket } = await seedTicket();
    await expect(
      useCase.execute({
        ticketId: ticket.id,
        userId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never,
        pin: '1234',
        motivo: 'x',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrado/i);
  });

  it('rejects an operativo without canCancelSales', async () => {
    const operativo = await crearOperador.execute({
      businessId: BIZ,
      nombre: 'Op',
      pin: '1234',
      operatorLimit: 10,
    });
    const { ticket } = await seedTicket();
    await expect(
      useCase.execute({
        ticketId: ticket.id,
        userId: operativo.id,
        pin: '1234',
        motivo: 'x',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/permiso/i);
  });

  it('rejects cancelling a ticket that is already cancelled', async () => {
    const { ticket } = await seedTicket();
    const input = {
      ticketId: ticket.id,
      userId: directorId,
      pin: '1234',
      motivo: 'x',
      businessId: BIZ,
      stockEnabled: false,
    };
    await useCase.execute(input);
    await expect(useCase.execute(input)).rejects.toThrow(/ya fue cancelada/);
  });
});
