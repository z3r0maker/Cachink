/**
 * Reads the rows the Inventario screen says from the phone's repositories
 * (Track M, M-09): the stocked products with their ledger count, this
 * turno's manual movements (this device, since the apertura — the register's
 * `delTurno` rule), and the owner's first name for the empty answer. The
 * web operador's `inventarioDelTurno` said on the phone. Pure over the
 * repositories' rows; the shaping into `Existencia`/`Movimiento` stays in
 * `@xangarro/caja/inventario` (`comoInventario`).
 */
import { nombreDueno } from '@xangarro/caja';
import {
  delTurno,
  type FilaMovimiento,
  type InventarioPara,
  type MovimientoInventarioPara,
} from '@xangarro/caja/lectura';
import type { BusinessId, DeviceId, Product, UserId } from '@xangarro/domain';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { Repositories } from '../../app/repository-provider';

type R = Pick<Repositories, 'appConfig' | 'cajaTurnos' | 'products' | 'inventoryMovements'>;

/** Stock is the screen's only when tracked, alive and not awaiting review. */
export const seSigue = (p: Product): boolean =>
  p.seguirStock && p.deletedAt === null && p.estadoRevision !== 'pendiente';

export interface FilasInventario {
  /** The turno whose movements the list says: the open one, or the newest. */
  readonly turnoId: string | null;
  readonly inventario: InventarioPara;
  /** The owner's first name, or «el dueño» until the device knows it. */
  readonly dueno: string;
}

/** This device's manual movements of the turno (empty without a turno). */
async function movimientosDelTurno(
  r: R,
  businessId: BusinessId,
  deviceId: DeviceId,
  turnoFecha: string,
  aperturaAt: string,
  hoy: string,
): Promise<readonly MovimientoInventarioPara[]> {
  const rows = await r.inventoryMovements.findByDateRange(
    turnoFecha as never,
    hoy as never,
    businessId,
  );
  return delTurno(rows as unknown as readonly FilaMovimiento[], deviceId, aperturaAt);
}

/** The Inventario screen's read: stocked products and this turno's movements. */
export async function leerFilasInventario(
  r: R,
  businessId: BusinessId,
  userId: UserId,
  deviceId: DeviceId,
  hoy: string,
): Promise<FilasInventario> {
  const abierto = await r.cajaTurnos.findOpenByUser(userId);
  const turno = abierto ?? (await r.cajaTurnos.findLatest(businessId));
  const [productos, movimientos, dueno] = await Promise.all([
    r.products.listForBusiness(businessId),
    turno === null
      ? Promise.resolve([])
      : movimientosDelTurno(r, businessId, deviceId, turno.fecha, turno.aperturaAt, hoy),
    r.appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  ]);
  const existencias = await Promise.all(
    productos.filter(seSigue).map(async (p) => ({
      id: p.id,
      nombre: p.nombre,
      existencias: await r.inventoryMovements.sumStock(p.id),
      umbral: p.umbralStockBajo,
      unidad: p.unidad,
      icono: p.icono,
      color: p.colorFondo,
      categoria: p.categoria,
    })),
  );
  const inventario: InventarioPara = {
    existencias: existencias.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX')),
    movimientos,
  };
  return { turnoId: turno?.id ?? null, inventario, dueno: nombreDueno(dueno) };
}
