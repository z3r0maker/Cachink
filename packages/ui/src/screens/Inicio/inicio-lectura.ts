/**
 * Reads the rows Inicio says (`FilasInicio`) from the phone's repositories:
 * the operator's open turno (or the newest one on this device), its rows
 * (`leerFilasDelTurno`: tickets, lines, gastos and abonos), the last month of
 * turnos for «Tus últimos cortes», the recurring gastos already due and the
 * tracked products' stock for «Para hoy».
 */
import type { StockTarea } from '@xangarro/caja/inicio';
import type { BusinessId, IsoDate, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';
import { leerFilasDelTurno, SIN_FILAS } from '../MiTurno/filas-del-turno';
import type { FilasInicio } from './inicio-filas';

/** How far back «Tus últimos cortes» looks. */
const DIAS_CORTES = 30;

export function haceDias(hoy: string, dias: number): string {
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

type R = Pick<
  Repositories,
  | 'cajaTurnos'
  | 'tickets'
  | 'sales'
  | 'expenses'
  | 'clientPayments'
  | 'recurringExpenses'
  | 'products'
  | 'inventoryMovements'
>;

/** Tracked products with their stock and threshold, as Inventario reads them. */
export async function leerStock(r: R, businessId: BusinessId): Promise<readonly StockTarea[]> {
  const productos = (await r.products.listForBusiness(businessId)).filter(
    (p) => p.seguirStock && p.deletedAt === null,
  );
  return Promise.all(
    productos.map(async (p) => ({
      id: p.id,
      nombre: p.nombre,
      existencias: await r.inventoryMovements.sumStock(p.id),
      umbral: p.umbralStockBajo,
    })),
  );
}

export async function leerFilasInicio(
  r: R,
  businessId: BusinessId,
  userId: UserId,
  hoy: string,
): Promise<FilasInicio> {
  const abierto = await r.cajaTurnos.findOpenByUser(userId);
  const turno = abierto ?? (await r.cajaTurnos.findLatest(businessId));
  const [filas, turnos, recurrentes, stock] = await Promise.all([
    turno ? leerFilasDelTurno(r, turno.fecha, hoy, businessId) : Promise.resolve(SIN_FILAS),
    r.cajaTurnos.findByDateRange(haceDias(hoy, DIAS_CORTES), hoy, businessId),
    r.recurringExpenses.findDue(hoy as IsoDate, businessId),
    leerStock(r, businessId),
  ]);
  return { turno, ...filas, turnos, recurrentes, stock };
}
