/**
 * Reads the rows Mi turno and Cierre say (Track M, M-09) from the phone's
 * repositories: the operator's open turno and its tickets, lines, abonos and
 * gastos, this turno's inventory movements, the recurring gastos already due
 * and the last closed turnos — shaped as the web's live read (`TurnoVivoPara`
 * plus the turno id, ADR-118), so `comoTurno` and `comoCierre` from
 * `@xangarro/caja` say them exactly as the web does. Rows in, read models
 * out; the shaping itself lives in the caja package.
 */
import { hoyLocal } from '@xangarro/caja';
import { cierreDeFilas, type FilasCierre } from '@xangarro/caja/cierre';
import {
  contar,
  delTurno as delTurnoInventario,
  detalleDelTurno,
  type TurnoVivoPara,
} from '@xangarro/caja/lectura';
import type { BusinessId, IsoDate, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';
import { comoRecurrente, cortesDe } from '../Inicio/inicio-filas';

type R = Pick<
  Repositories,
  | 'cajaTurnos'
  | 'tickets'
  | 'sales'
  | 'expenses'
  | 'clientPayments'
  | 'clients'
  | 'inventoryMovements'
  | 'recurringExpenses'
>;

/** How far back «Tus últimos cortes» looks (the phone's Inicio reads 30). */
const DIAS_CORTES = 60;

function haceDias(hoy: string, dias: number): string {
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/** The clients the fiado tickets and the abonos name, by id. */
async function nombresDe(r: R, ids: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const pares = await Promise.all(
    [...new Set(ids)].map(
      async (id) => [id, (await r.clients.findById(id as never))?.nombre] as const,
    ),
  );
  return new Map(pares.flatMap(([id, n]) => (n === undefined ? [] : [[id, n] as const])));
}

/** Everything the open turno says, or null when there is none. */
export async function leerTurnoVivo(
  r: R,
  businessId: BusinessId,
  userId: UserId,
  deviceId: string,
): Promise<{ readonly turnoId: string; readonly vivo: TurnoVivoPara } | null> {
  const turno = await r.cajaTurnos.findOpenByUser(userId);
  if (turno === null) return null;
  const hoy = hoyLocal();
  const [delTurno, lineas, abonos, gastos, movimientos, recurrentes, turnos] = await Promise.all([
    r.tickets.findByCajaTurno(turno.id),
    r.sales.findByDateRange(turno.fecha, hoy as never, businessId),
    r.clientPayments.findByDateRange(turno.fecha, hoy as never, businessId),
    r.expenses.findByCajaTurno(turno.id),
    r.inventoryMovements.findByDateRange(turno.fecha, hoy as never, businessId),
    r.recurringExpenses.findDue(hoy as IsoDate, businessId),
    r.cajaTurnos.findByDateRange(haceDias(hoy, DIAS_CORTES), hoy, businessId),
  ]);
  const ids = [
    ...delTurno.flatMap((t) => (t.clienteId === null ? [] : [t.clienteId as string])),
    ...abonos.map((a) => a.clienteId as string),
  ];
  const nombres = await nombresDe(r, ids);
  const filas: FilasCierre = { turno, delTurno, lineas, abonos, gastos };
  const cierre = cierreDeFilas(filas);
  const inventario = contar(delTurnoInventario(movimientos as never, deviceId, turno.aperturaAt));
  return {
    turnoId: turno.id,
    vivo: {
      cierre: { ...cierre, resumen: { ...cierre.resumen, ...inventario } },
      aperturaAt: turno.aperturaAt,
      ...detalleDelTurno({ delTurno, lineas, abonos, gastos }, nombres),
      recurrentes: recurrentes.map((x) => comoRecurrente(x, hoy)),
      cortes: cortesDe(turnos),
    },
  };
}
