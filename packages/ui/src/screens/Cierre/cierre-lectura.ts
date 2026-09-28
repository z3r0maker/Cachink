/**
 * Cierre over the phone's rows (MvCierre; the web's `runtime/cierre.ts` +
 * `cierre/viva.tsx`): the operator's open turno, its rows
 * (`leerFilasDelTurno`, as the close use case reads them) and its inventory
 * movements, said as the screen's `CierreData`: the four parts of the
 * expected cash (`partesDelTurno`), the Resumen (`resumenDelTurno` over the
 * turno's own tickets, entradas and mermas from `contar`), who, the caja
 * and the owner. The count starts at zero, as on the web.
 */
import { hhmmLocal, nombreDueno } from '@xangarro/caja';
import type { CierreData } from '@xangarro/caja/cierre';
import {
  contar,
  delTurno as movimientosDelTurno,
  partesDelTurno,
  resumenDelTurno,
  type FilaMovimiento,
} from '@xangarro/caja/lectura';
import type { BusinessId, CajaTurno, InventoryMovement, IsoDate, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';
import { leerFilasDelTurno, type FilasDelTurno, type RepoFilas } from '../MiTurno/filas-del-turno';

export interface FilasCierre extends FilasDelTurno {
  readonly turno: CajaTurno;
  readonly inventario: readonly InventoryMovement[];
}

type R = RepoFilas & Pick<Repositories, 'cajaTurnos' | 'inventoryMovements'>;

/** The operator's open turno and its rows; null when no turno is open. */
export async function leerFilasCierre(
  r: R,
  businessId: BusinessId,
  userId: UserId,
  hoy: string,
): Promise<FilasCierre | null> {
  const turno = await r.cajaTurnos.findOpenByUser(userId);
  if (turno === null) return null;
  const hasta = (hoy > turno.fecha ? hoy : turno.fecha) as IsoDate;
  const [filas, inventario] = await Promise.all([
    leerFilasDelTurno(r, turno.fecha, hoy, businessId),
    r.inventoryMovements.findByDateRange(turno.fecha as IsoDate, hasta, businessId),
  ]);
  return { turno, ...filas, inventario };
}

export interface EntornoCierre {
  readonly operador: string;
  readonly caja: string;
  readonly negocio: string | null;
  /** The owner's name from the last pull; «el dueño» while unknown. */
  readonly dueno: string | null;
  readonly deviceId: string | null;
  readonly ahora: Date;
}

function resumenDe(f: FilasCierre, deviceId: string | null): CierreData['resumen'] {
  const tickets = f.tickets.filter((t) => t.deletedAt === null && t.cajaTurnoId === f.turno.id);
  const r = resumenDelTurno(tickets, f.lineas);
  const canceladas = tickets.filter((t) => t.cancelledAt !== null);
  const [una] = canceladas;
  const movs =
    deviceId === null
      ? []
      : movimientosDelTurno(
          f.inventario as unknown as readonly FilaMovimiento[],
          deviceId,
          f.turno.aperturaAt,
        );
  return {
    ventas: r.ventas,
    cobrado: BigInt(r.cobradoCentavos),
    canceladas: r.canceladas,
    cancelado: BigInt(r.canceladoCentavos),
    ...(canceladas.length === 1 && una?.cancelledAt
      ? { canceladaHora: hhmmLocal(una.cancelledAt) }
      : {}),
    fiado: BigInt(r.fiadoCentavos),
    ...contar(movs),
  };
}

export function cierreMovil(f: FilasCierre, e: EntornoCierre): CierreData {
  return {
    operador: e.operador,
    caja: e.caja,
    desde: hhmmLocal(f.turno.aperturaAt),
    hasta: hhmmLocal(e.ahora.toISOString()),
    dueno: nombreDueno(e.dueno),
    ...(e.negocio ? { negocio: e.negocio } : {}),
    partes: partesDelTurno(f.turno, f),
    resumen: resumenDe(f, e.deviceId),
    conteo: {},
  };
}
