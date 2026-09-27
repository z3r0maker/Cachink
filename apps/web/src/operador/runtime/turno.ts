/**
 * The open turno, live (O-39): Mi turno and Inicio read the same rows Cierre
 * does (`filasDelTurno`) and the same close figures (`cierreDeFilas`), plus
 * the turno's detail, the recurring expenses already due and this caja's
 * last closed turnos, all from the register's own database.
 */

import {
  DrizzleCajaTurnosRepository,
  DrizzleClientsRepository,
  DrizzleRecurringExpensesRepository,
} from '@xangarro/data';
import type { BusinessId } from '@xangarro/domain';

import { cierreDeFilas, filasDelTurno } from './cierre';
import type { Db } from './db-types';
import { hoyLocal } from './fechas';
import type { WorkerRequest } from './protocol';
import { detalleDelTurno } from './turno-detalle';
import type { CortePara, RecurrentePara, TurnoVivoPara } from './turno-shapes';

/** Days from `a` to `b`, both `YYYY-MM-DD`. */
const diasEntre = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** `fecha` moved back `dias` days. */
function haceDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/** How far back «Tus últimos cortes» looks, and how many it lists. */
const DIAS_CORTES = 60;
const CORTES = 4;

async function nombresDe(
  db: Db,
  deviceId: string,
  ids: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const clients = new DrizzleClientsRepository(db as never, deviceId as never);
  const pares = await Promise.all(
    [...new Set(ids)].map(
      async (id) => [id, (await clients.findById(id as never))?.nombre] as const,
    ),
  );
  return new Map(pares.flatMap(([id, n]) => (n === undefined ? [] : [[id, n] as const])));
}

async function recurrentesDe(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<readonly RecurrentePara[]> {
  const repo = new DrizzleRecurringExpensesRepository(db as never, deviceId as never);
  const hoy = hoyLocal();
  const due = await repo.findDue(hoy as never, businessId);
  return due.map((r) => ({
    id: r.id,
    concepto: r.concepto,
    frecuencia: r.frecuencia,
    diaDelMes: r.diaDelMes,
    proveedor: r.proveedor,
    montoCentavos: r.montoCentavos.toString(),
    vence: diasEntre(hoy, r.proximoDisparo),
  }));
}

async function cortesDe(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<readonly CortePara[]> {
  const turnos = new DrizzleCajaTurnosRepository(db as never, deviceId as never);
  const hoy = hoyLocal();
  const rows = await turnos.findByDateRange(haceDias(hoy, DIAS_CORTES), hoy, businessId);
  return rows
    .filter((t) => t.cierreAt !== null)
    .slice(0, CORTES)
    .map((t) => ({ fecha: t.fecha, diferenciaCentavos: (t.diferenciaCentavos ?? 0n).toString() }));
}

/** Everything Mi turno and Inicio show about the open turno. */
export async function turnoVivo(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  turnoId: string,
): Promise<TurnoVivoPara> {
  const filas = await filasDelTurno(db, businessId, deviceId, turnoId);
  const ids = [
    ...filas.delTurno.flatMap((t) => (t.clienteId === null ? [] : [t.clienteId as string])),
    ...filas.abonos.map((a) => a.clienteId as string),
  ];
  const nombres = await nombresDe(db, deviceId, ids);
  return {
    cierre: cierreDeFilas(filas),
    aperturaAt: filas.turno.aperturaAt,
    ...detalleDelTurno(filas, nombres),
    recurrentes: await recurrentesDe(db, businessId, deviceId),
    cortes: await cortesDe(db, businessId, deviceId),
  };
}

/** The router's handler for `turnoVivo`. */
export function leerTurnoVivo(
  request: Extract<WorkerRequest, { readonly method: 'turnoVivo' }>,
  rt: { readonly db: Db },
): Promise<TurnoVivoPara> {
  return turnoVivo(rt.db, request.businessId as never, request.deviceId, request.turnoId);
}
