/**
 * Reads the rows Inicio says (`FilasInicio`) from the phone's repositories:
 * the operator's open turno (or the newest CLOSED one on this device — an
 * open turno that belongs to a colleague is nobody else's Inicio), that
 * day's tickets, lines and gastos, the turno's cash movements, the last
 * month of turnos for «Tus últimos cortes», the recurring gastos already
 * due and the tracked products' stock for «Para hoy».
 */
import type { StockTarea } from '@xangarro/caja/inicio';
import type { BusinessId, IsoDate, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';
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
  | 'cajaMovimientos'
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
  // The fallback shows the day's figures after a cierre — but a colleague's
  // synced OPEN turno must not take it: the hero would read «la caja está
  // lista» while Cobrar gates on the operator's OWN turno, hiding the one
  // «Abrir turno» and leaving them unable to sell or open (the M-11
  // regression's stuck-operator case).
  const anterior = await r.cajaTurnos.findLatest(businessId);
  const turno = abierto ?? (anterior !== null && anterior.cierreAt !== null ? anterior : null);
  const fecha = turno?.fecha ?? hoy;
  const [tickets, lineas, gastos, movimientos, turnos, recurrentes, stock] = await Promise.all([
    r.tickets.findByDateRange(fecha, fecha, businessId),
    r.sales.findByDateRange(fecha, fecha, businessId),
    r.expenses.findByDateRange(fecha, fecha, businessId),
    turno ? r.cajaMovimientos.findByTurno(turno.id) : Promise.resolve([]),
    r.cajaTurnos.findByDateRange(haceDias(hoy, DIAS_CORTES), hoy, businessId),
    r.recurringExpenses.findDue(hoy as IsoDate, businessId),
    leerStock(r, businessId),
  ]);
  return { turno, tickets, lineas, gastos, movimientos, turnos, recurrentes, stock };
}
