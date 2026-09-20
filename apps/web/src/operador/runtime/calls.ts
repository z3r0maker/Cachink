/**
 * The Worker's request builders, minus their RPC id — the client's methods
 * are one line each and the payloads live beside their protocol (O-34).
 */

import type { ReferenceTables } from '@xangarro/contracts';
import type { TicketPara, VentaPara, WorkerRequest } from './protocol';

/** A request minus its RPC id — kept derived so it can never drift. */
export type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type Call = DistributiveOmit<WorkerRequest, 'id'>;

export interface ProductoPara {
  readonly id: string;
  readonly nombre: string;
  readonly precio: string;
  readonly categoria: string;
}

export interface VentasTurno {
  readonly desde: string;
  readonly ventas: readonly VentaPara[];
}

export interface TicketVivo {
  readonly turnoDesde: string;
  readonly capturo: string;
  readonly ticket: TicketPara | null;
}

export interface CancelarInput {
  readonly businessId: string;
  readonly deviceId: string;
  readonly userId: string;
  readonly ticketId: string;
  readonly pin: string;
  readonly motivo: string;
}

export interface AbonoInput {
  readonly businessId: string;
  readonly deviceId: string;
  readonly clienteId: string;
  readonly montoCentavos: bigint;
  readonly metodo: string;
  readonly fecha: string;
}

export const vincular = (tables: ReferenceTables, businessId: string): Call => ({
  method: 'vincular',
  tables,
  businessId,
});

export const operadores = (businessId: string, deviceId: string): Call => ({
  method: 'operadores',
  businessId,
  deviceId,
});

export const autenticar = (
  businessId: string,
  deviceId: string,
  nombre: string,
  nip: string,
): Call => ({ method: 'autenticar', businessId, deviceId, nombre, nip });

export const abrirCaja = (
  businessId: string,
  deviceId: string,
  userId: string,
  fondoCentavos: bigint,
): Call => ({
  method: 'abrirCaja',
  businessId,
  deviceId,
  userId,
  fondoCentavos: fondoCentavos.toString(),
});

export const turnoAbierto = (businessId: string, deviceId: string): Call => ({
  method: 'turnoAbierto',
  businessId,
  deviceId,
});

export const productos = (businessId: string, deviceId: string): Call => ({
  method: 'productos',
  businessId,
  deviceId,
});

export const ventas = (businessId: string, deviceId: string, turnoId: string): Call => ({
  method: 'ventas',
  businessId,
  deviceId,
  turnoId,
});

export const ticket = (businessId: string, deviceId: string, folio: number): Call => ({
  method: 'ticket',
  businessId,
  deviceId,
  folio,
});

export const cuentas = (businessId: string, deviceId: string): Call => ({
  method: 'cuentas',
  businessId,
  deviceId,
});

export const abonar = (p: AbonoInput): Call => ({
  method: 'abonar',
  businessId: p.businessId,
  deviceId: p.deviceId,
  clienteId: p.clienteId,
  montoCentavos: p.montoCentavos.toString(),
  metodo: p.metodo,
  fecha: p.fecha,
});

export const cancelar = (p: CancelarInput): Call => ({ method: 'cancelar', ...p });
