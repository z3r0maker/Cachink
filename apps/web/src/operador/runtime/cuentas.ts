/**
 * The register's credit accounts (O-33): every client with their fiado
 * tickets and abonos — the two facts an account is (ADR-074) — with the
 * domain's derived saldo, and the abono write through the real use case.
 */

import { estadoDeCuenta } from '@xangarro/domain';
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

/** One client's account: fiado history, abonos, and the derived saldo. */
async function cuentaDe(
  c: {
    id: string;
    nombre: string;
    telefono: string | null;
    createdAt: string;
    limiteCentavos: bigint | null;
    plazoDias: number | null;
  },
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
    await Promise.all(ventas.map(async (t) => [t.id, await totalDe(repos.sales, t.id)] as const)),
  );
  const e = estadoDeCuenta(
    ventas.map((t) => ({ id: t.id, fecha: t.fecha, monto: montos.get(t.id) ?? 0n })),
    abonos.map((a) => ({ id: a.id, fecha: a.fecha, monto: a.montoCentavos })),
  );
  return {
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    creado: c.createdAt,
    limiteCentavos: c.limiteCentavos?.toString() ?? null,
    plazoDias: c.plazoDias,
    saldoCentavos: e.saldo.toString(),
    ventas: await ventasDe(ventas, montos, repos.users),
    abonos: abonos.map(comoAbono),
  };
}

async function ventasDe(
  ventas: readonly {
    id: string;
    folio: number;
    concepto: string;
    fecha: string;
    hora: string | null;
    createdByUserId: string | null;
  }[],
  montos: ReadonlyMap<string, bigint>,
  users: DrizzleUsersRepository,
): Promise<CuentaPara['ventas']> {
  return Promise.all(
    ventas.map(async (t) => ({
      folio: t.folio,
      concepto: t.concepto,
      fecha: `${t.fecha}T${t.hora ?? '00:00'}`,
      montoCentavos: (montos.get(t.id) ?? 0n).toString(),
      capturo: await capturo(users, t.createdByUserId),
    })),
  );
}

function comoAbono(a: {
  id: string;
  fecha: string;
  montoCentavos: bigint;
  metodo: string;
  nota: string | null;
}): CuentaPara['abonos'][number] {
  return {
    id: a.id,
    fecha: a.fecha,
    montoCentavos: a.montoCentavos.toString(),
    metodo: a.metodo,
    nota: a.nota,
  };
}

/** A ticket's amount is what its lines say; the header carries no total. */
async function totalDe(sales: DrizzleSalesRepository, ticketId: string): Promise<bigint> {
  const lineas = await sales.findByTicket(ticketId as never);
  return lineas.reduce((acc, l) => acc + (l.monto as bigint), 0n);
}

/** «Ana Robledo · Caja 1» — who captured the ticket. */
async function capturo(users: DrizzleUsersRepository, userId: string | null): Promise<string> {
  if (userId === null) return 'Caja 1';
  const nombre = (await users.findById(userId as never))?.nombre ?? 'Caja 1';
  return `${nombre} · Caja 1`;
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
