/**
 * The Worker's access-method router (O-12 → O-35): one table from method to
 * handler, no method left behind. Handlers narrow the request union
 * themselves; only `db` is ever used from the runtime.
 */

import * as access from './access';
import { catalogo } from './catalogo';
import { abonar, cuentasDelNegocio } from './cuentas';
import { gastosDelTurno, registrarGasto } from './gastos';
import { cancelarTicket, ticketPorFolio, ventasDelTurno } from './tickets';
import type { Db } from './db-types';
import type { WorkerRequest } from './protocol';

interface Rt {
  readonly db: Db;
}
type Handler = (request: WorkerRequest, rt: Rt) => Promise<unknown>;
const estrecho = (fn: (request: never, rt: Rt) => Promise<unknown>): Handler => fn as Handler;

/** The linking door and the turno (O-12). */
type AccesoBasicoRequest = Extract<
  WorkerRequest,
  { readonly method: 'vincular' | 'autenticar' | 'abrirCaja' }
>;

function accesoBasico(request: AccesoBasicoRequest, rt: Rt): Promise<unknown> {
  if (request.method === 'vincular') {
    return access.vincularBootstrap(rt.db, request.tables, request.businessId as never);
  }
  if (request.method === 'autenticar') {
    return access.autenticar(
      rt.db,
      request.businessId as never,
      request.deviceId,
      request.nombre,
      request.nip,
    );
  }
  return access.abrirCaja(
    rt.db,
    request.businessId as never,
    request.deviceId,
    request.userId,
    BigInt(request.fondoCentavos),
  );
}

/** O-33's credit accounts: the read and the abono write. */
type CuentasRequest = Extract<WorkerRequest, { readonly method: 'cuentas' | 'abonar' }>;

function leerCuentas(request: CuentasRequest, rt: Rt): Promise<unknown> {
  if (request.method === 'cuentas') {
    return cuentasDelNegocio(rt.db, request.businessId as never, request.deviceId);
  }
  return abonar(rt.db, {
    businessId: request.businessId as never,
    deviceId: request.deviceId,
    clienteId: request.clienteId as never,
    montoCentavos: BigInt(request.montoCentavos),
    metodo: request.metodo as never,
    fecha: request.fecha,
  });
}

/** The register's data reads and writes (O-06/O-32/O-35). */
type DatoRequest = Extract<
  WorkerRequest,
  { readonly method: 'productos' | 'ventas' | 'ticket' | 'cancelar' | 'gastos' | 'gastar' }
>;

function leerDato(request: DatoRequest, rt: Rt): Promise<unknown> {
  if (request.method === 'productos') {
    return catalogo(rt.db, request.businessId as never, request.deviceId);
  }
  if (request.method === 'ventas') {
    return ventasDelTurno(rt.db, request.businessId as never, request.deviceId, request.turnoId);
  }
  if (request.method === 'ticket') {
    return ticketPorFolio(rt.db, request.businessId as never, request.deviceId, request.folio);
  }
  if (request.method === 'gastos') {
    return gastosDelTurno(rt.db, request.businessId as never, request.deviceId, request.turnoId);
  }
  if (request.method === 'gastar') {
    return registrarGasto(rt.db, {
      businessId: request.businessId as never,
      deviceId: request.deviceId,
      userId: request.userId as never,
      turnoId: request.turnoId as never,
      concepto: request.concepto,
      categoria: request.categoria,
      monto: BigInt(request.montoCentavos),
      proveedor: request.proveedor,
    });
  }
  return cancelarTicket(rt.db, {
    businessId: request.businessId as never,
    deviceId: request.deviceId,
    userId: request.userId as never,
    ticketId: request.ticketId as never,
    pin: request.pin,
    motivo: request.motivo,
  });
}

function leerOperadores(
  request: {
    readonly method: 'operadores' | 'turnoAbierto';
    readonly businessId: string;
    readonly deviceId: string;
  },
  rt: Rt,
): Promise<unknown> {
  const args = [rt.db, request.businessId as never, request.deviceId] as const;
  return request.method === 'operadores'
    ? access.operadores(...args)
    : access.turnoAbierto(...args);
}

/** Method → handler; every op needs the booted runtime and persists after. */
const POR_METODO: Readonly<Record<string, Handler>> = {
  vincular: estrecho(accesoBasico),
  autenticar: estrecho(accesoBasico),
  abrirCaja: estrecho(accesoBasico),
  operadores: estrecho(leerOperadores),
  turnoAbierto: estrecho(leerOperadores),
  cuentas: estrecho(leerCuentas),
  abonar: estrecho(leerCuentas),
  productos: estrecho(leerDato),
  ventas: estrecho(leerDato),
  ticket: estrecho(leerDato),
  cancelar: estrecho(leerDato),
  gastos: estrecho(leerDato),
  gastar: estrecho(leerDato),
};

export { POR_METODO };
