/**
 * The register's credit accounts (O-33): every client with their fiado
 * tickets and abonos — the two facts an account is (ADR-074) — with the
 * domain's derived saldo, and the abono write through the real use case.
 */

import {
  capturoDe,
  cuentaPara,
  totalDeLineas,
  type ClienteCuentaFila,
} from '@xangarro/caja/lectura';
import { RegistrarPagoClienteUseCase } from '@xangarro/application';
import {
  DrizzleClientPaymentsRepository,
  DrizzleClientsRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
  DrizzleUsersRepository,
} from '@xangarro/data';
import type { BusinessId, ClientId, PaymentMethod } from '@xangarro/domain';

import type { Db } from './db-types';
import type { CuentaPara } from './protocol';

/** All the business's accounts, straight from the register's database. */
export async function cuentasDelNegocio(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<readonly CuentaPara[]> {
  const repos = {
    clients: new DrizzleClientsRepository(db as never, deviceId as never),
    tickets: new DrizzleTicketsRepository(db as never, deviceId as never),
    sales: new DrizzleSalesRepository(db as never, deviceId as never),
    payments: new DrizzleClientPaymentsRepository(db as never, deviceId as never),
    users: new DrizzleUsersRepository(db as never, deviceId as never),
  };
  const rows = await repos.clients.findByName('', businessId);
  return Promise.all(rows.map((c) => cuentaDe(c, repos)));
}

/** One client's account: its rows, assembled by `@xangarro/caja`'s `cuentaPara`. */
async function cuentaDe(
  c: ClienteCuentaFila,
  repos: {
    tickets: DrizzleTicketsRepository;
    sales: DrizzleSalesRepository;
    payments: DrizzleClientPaymentsRepository;
    users: DrizzleUsersRepository;
  },
): Promise<CuentaPara> {
  const ventas = await repos.tickets.findCreditoByClient(c.id as never);
  const abonos = await repos.payments.findByCliente(c.id as never);
  const montos = new Map(
    await Promise.all(
      ventas.map(
        async (t) => [t.id, totalDeLineas(await repos.sales.findByTicket(t.id as never))] as const,
      ),
    ),
  );
  const capturos = new Map(
    await Promise.all(
      ventas.map(async (t) => [t.id, await capturo(repos.users, t.createdByUserId)] as const),
    ),
  );
  return cuentaPara({ cliente: c, ventas, montos, abonos, capturos });
}

/** «Ana Robledo · Caja 1» — who captured the ticket. */
async function capturo(users: DrizzleUsersRepository, userId: string | null): Promise<string> {
  if (userId === null) return capturoDe(null, null);
  return capturoDe(userId, (await users.findById(userId as never))?.nombre);
}

/** Record an abono through the use case — whole, oldest-first is derived (D5). */
export async function abonar(
  db: Db,
  p: {
    readonly businessId: BusinessId;
    readonly deviceId: string;
    readonly clienteId: ClientId;
    readonly montoCentavos: bigint;
    readonly metodo: PaymentMethod;
    readonly fecha: string;
  },
): Promise<{ readonly id: string; readonly fecha: string }> {
  const useCase = new RegistrarPagoClienteUseCase(
    new DrizzleClientPaymentsRepository(db as never, p.deviceId as never),
    new DrizzleClientsRepository(db as never, p.deviceId as never),
  );
  const pago = await useCase.execute({
    clienteId: p.clienteId,
    fecha: p.fecha as never,
    montoCentavos: p.montoCentavos,
    metodo: p.metodo,
    businessId: p.businessId,
  });
  return { id: pago.id, fecha: pago.fecha };
}
