import assert from 'node:assert/strict';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The register's ticket operations (O-06/O-32), the Drizzle repositories and
 * use cases mocked to their interfaces: registering runs the same atomic use
 * case the phone runs with the business's own stock switch read first; the
 * turno's list joins the tickets to their lines; and a cancellation asks for
 * the operator's PIN before it refunds anything.
 */

const {
  consultas,
  DrizzleTicketsRepository,
  DrizzleSalesRepository,
  DrizzleClientsRepository,
  DrizzleProductsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleCajaTurnosRepository,
  DrizzleBusinessesRepository,
  DrizzleUsersRepository,
  DrizzleCancelacionLogsRepository,
} = vi.hoisted(() => {
  const consultas = {
    findOpenByBusiness: vi.fn(async () => null),
    findById: vi.fn(async () => null),
    findByCajaTurno: vi.fn(async () => [] as unknown[]),
    findByTicket: vi.fn(async () => [] as unknown[]),
    usersFindById: vi.fn(async () => null),
    clientsFindById: vi.fn(async () => null),
  };
  // `new` refuses arrows: constructable function mocks throughout.
  const Tickets = vi.fn(function (this: unknown) {
    Object.assign(this, { findByCajaTurno: consultas.findByCajaTurno });
    return this;
  });
  const Turnos = vi.fn(function (this: unknown) {
    Object.assign(this, {
      findOpenByBusiness: consultas.findOpenByBusiness,
      findById: consultas.findById,
    });
    return this;
  });
  const Sales = vi.fn(function (this: unknown) {
    Object.assign(this, { findByTicket: consultas.findByTicket });
    return this;
  });
  const Users = vi.fn(function (this: unknown) {
    Object.assign(this, { findById: consultas.usersFindById });
    return this;
  });
  const Negocio = vi.fn(function (this: unknown) {
    Object.assign(this, { findById: vi.fn(async () => null) });
    return this;
  });
  const Clients = vi.fn(function (this: unknown) {
    Object.assign(this, { findById: consultas.clientsFindById });
    return this;
  });
  const plano = () =>
    vi.fn(function (this: unknown) {
      return this;
    });
  return {
    consultas,
    DrizzleTicketsRepository: Tickets,
    DrizzleSalesRepository: Sales,
    DrizzleClientsRepository: Clients,
    DrizzleProductsRepository: plano(),
    DrizzleInventoryMovementsRepository: plano(),
    DrizzleCajaTurnosRepository: Turnos,
    DrizzleBusinessesRepository: Negocio,
    DrizzleUsersRepository: Users,
    DrizzleCancelacionLogsRepository: plano(),
  };
});

const execute = vi.fn();

vi.mock('@xangarro/data', () => ({
  DrizzleTicketsRepository,
  DrizzleSalesRepository,
  DrizzleClientsRepository,
  DrizzleProductsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleCajaTurnosRepository,
  DrizzleBusinessesRepository,
  DrizzleUsersRepository,
  DrizzleCancelacionLogsRepository,
}));
const { RegistrarTicketUseCase, CancelarTicketUseCase } = vi.hoisted(() => {
  const hacer = (ejecutar: (...a: unknown[]) => unknown) =>
    vi.fn(function (this: unknown) {
      Object.assign(this, { execute: (input: never) => ejecutar(input) });
      return this;
    });
  return {
    RegistrarTicketUseCase: hacer((...a: unknown[]) => execute(...a)),
    CancelarTicketUseCase: hacer((...a: unknown[]) => execute(...a)),
  };
});
vi.mock('@xangarro/application', () => ({ RegistrarTicketUseCase, CancelarTicketUseCase }));
vi.mock('../../src/operador/runtime/cuentas', () => ({
  cuentasDelNegocio: vi.fn(async () => new Map()),
}));
vi.mock('@xangarro/caja', async (orig) => ({
  ...(await orig()),
  hhmmLocal: () => '08:15',
}));

const { registrarTicket, ticketPorFolio, ventasDelTurno } =
  await import('../../src/operador/runtime/tickets');
import { TEST_DEVICE_ID } from '@xangarro/testing';
import type { RegistrarTicketInput } from '@xangarro/application';

const DB = {} as never;
const CTX = { deviceId: TEST_DEVICE_ID, userId: null };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registrarTicket', () => {
  const INPUT = {
    ticket: {
      fecha: '2026-09-28',
      hora: '14:52',
      concepto: 'Tacos',
      metodo: 'Efectivo',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BUS',
    },
    lineas: [],
  } as unknown as RegistrarTicketInput;

  it('runs the phone’s own atomic use case and returns its folio', async () => {
    execute.mockResolvedValue({ ticket: { folio: 41 } });
    const r = await registrarTicket(DB, INPUT, CTX);
    assert.deepEqual(r, { folio: 41 });
    expect(RegistrarTicketUseCase).toHaveBeenCalled();
    expect(execute).toHaveBeenCalledWith(INPUT);
  });

  it('a business the repository cannot read means stock off — the safe default', async () => {
    execute.mockResolvedValue({ ticket: { folio: 1 } });
    await registrarTicket(DB, INPUT, CTX);
    const config = (RegistrarTicketUseCase as ReturnType<typeof vi.fn>).mock.calls[0]?.[6] as {
      stockEnabled: boolean;
    };
    assert.equal(config.stockEnabled, false);
  });

  it('a business with the stock switch on moves stock through the use case', async () => {
    (DrizzleBusinessesRepository as ReturnType<typeof vi.fn>).mockImplementationOnce(function (
      this: unknown,
    ) {
      Object.assign(this, { findById: vi.fn(async () => ({ featureFlags: '{"stock":true}' })) });
      return this;
    });
    execute.mockResolvedValue({ ticket: { folio: 2 } });
    await registrarTicket(DB, INPUT, CTX);
    const config = (RegistrarTicketUseCase as ReturnType<typeof vi.fn>).mock.calls[0]?.[6] as {
      stockEnabled: boolean;
    };
    assert.equal(config.stockEnabled, true);
  });

  it('a use case refusal flies, never a wrapped lie', async () => {
    execute.mockRejectedValue(Object.assign(new Error('Turno cerrado'), { code: 'TURNO_CERRADO' }));
    await assert.rejects(registrarTicket(DB, INPUT, CTX), /Turno cerrado/);
  });
});

describe('ticketPorFolio', () => {
  const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as never;

  it('no open turno: no ticket, the hour still said', async () => {
    consultas.findOpenByBusiness.mockResolvedValue(null);
    const r = await ticketPorFolio(DB, BIZ, TEST_DEVICE_ID, 41);
    assert.deepEqual(r, { turnoDesde: '08:15', capturo: 'Caja 1', ticket: null });
  });

  it('ventasDelTurno sums its lines and names its client, or shows none', async () => {
    consultas.findByCajaTurno.mockResolvedValue([
      {
        id: 'tk-1',
        folio: 41,
        concepto: 'Tacos',
        clienteId: 'c-1',
        metodo: 'Efectivo',
        hora: '14:52',
        cancelMotivo: null,
      },
    ]);
    consultas.findByTicket.mockResolvedValue([{ monto: 12000n }, { monto: 8000n }]);
    consultas.clientsFindById.mockResolvedValue({ nombre: 'María López' });
    const r = await ventasDelTurno(DB, BIZ, TEST_DEVICE_ID, 't-1');
    assert.deepEqual(r.ventas, [
      {
        id: 'tk-1',
        folio: 41,
        concepto: 'Tacos',
        montoCentavos: '20000',
        metodo: 'Efectivo',
        hora: '14:52',
        cliente: 'María López',
        cancelada: null,
      },
    ]);

    // A cash sale with no client, no hora, and a cancellation note.
    consultas.findByCajaTurno.mockResolvedValue([
      {
        id: 'tk-2',
        folio: 42,
        concepto: 'Refresco',
        clienteId: null,
        metodo: 'Efectivo',
        hora: null,
        cancelMotivo: 'se cobró dos veces',
      },
    ]);
    consultas.findByTicket.mockResolvedValue([{ monto: 2500n }]);
    const sinCliente = await ventasDelTurno(DB, BIZ, TEST_DEVICE_ID, 't-1');
    assert.equal(sinCliente.ventas[0]?.cliente, null);
    assert.equal(sinCliente.ventas[0]?.hora, '');
    assert.equal(sinCliente.ventas[0]?.cancelada, 'se cobró dos veces');
  });

  it('an open turno without that folio: still no ticket', async () => {
    consultas.findOpenByBusiness.mockResolvedValue({
      id: 't-1',
      aperturaAt: '2026-09-28T08:15:00',
    });
    consultas.findByCajaTurno.mockResolvedValue([{ folio: 40, id: 'tk-40' }]);
    const r = await ticketPorFolio(DB, BIZ, TEST_DEVICE_ID, 41);
    assert.equal(r.ticket, null);
  });
});
