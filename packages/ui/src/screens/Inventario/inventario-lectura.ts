/**
 * Inventario's read on the phone (MvInventario, the web's O-24 read in
 * `operador/runtime/inventario.ts`): the business's tracked products with
 * their stock from the ledger (`sumStock`), and this turno's manual
 * movements on this device (`delTurno`: entradas and mermas since the
 * apertura, never a sale's). Said the way the screen says them through
 * `@xangarro/caja/inventario` (`comoExistencia`, `comoMovimiento`); the
 * product's glyph and tint are the phone catalogue's, as Cobrar draws them.
 */
import type { Existencia, Movimiento } from '@xangarro/caja/inventario';
import { comoExistencia, comoMovimiento } from '@xangarro/caja/inventario';
import { delTurno, type FilaMovimiento } from '@xangarro/caja/lectura';
import {
  resolveProductIcon,
  type BusinessId,
  type IsoDate,
  type Money,
  type Product,
  type ProductIcon,
  type UserId,
} from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';
import { PRODUCT_BG_COLORS } from '../../product-colors';

export interface ExistenciaMovil extends Existencia {
  /** The product's own glyph, as the Cobrar tile draws it. */
  readonly glifo: ProductIcon;
  readonly costoUnitCentavos: Money;
}

export interface InventarioLeido {
  readonly existencias: readonly ExistenciaMovil[];
  readonly movimientos: readonly Movimiento[];
}

type R = Pick<Repositories, 'products' | 'inventoryMovements' | 'cajaTurnos'>;

/** Stock is the screen's only when tracked, alive and not awaiting review (the web's `seSigue`). */
export const seSigue = (p: Product): boolean =>
  p.seguirStock && p.deletedAt === null && p.estadoRevision !== 'pendiente';

async function existencias(r: R, businessId: BusinessId): Promise<ExistenciaMovil[]> {
  const productos = (await r.products.listForBusiness(businessId)).filter(seSigue);
  const out = await Promise.all(
    productos.map(async (p) => ({
      ...comoExistencia({
        id: p.id,
        nombre: p.nombre,
        existencias: await r.inventoryMovements.sumStock(p.id),
        umbral: p.umbralStockBajo,
        unidad: p.unidad,
        icono: p.icono,
        color: p.colorFondo,
        categoria: p.categoria,
      }),
      tint: PRODUCT_BG_COLORS[p.colorFondo],
      glifo: resolveProductIcon(p.icono, p.categoria),
      costoUnitCentavos: p.costoUnitCentavos,
    })),
  );
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
}

async function delTurnoAbierto(
  r: R,
  businessId: BusinessId,
  userId: UserId,
  deviceId: string,
  hoy: string,
): Promise<readonly Movimiento[]> {
  const turno = await r.cajaTurnos.findOpenByUser(userId);
  if (turno === null) return [];
  const filas = await r.inventoryMovements.findByDateRange(turno.fecha, hoy as IsoDate, businessId);
  return delTurno(filas as unknown as readonly FilaMovimiento[], deviceId, turno.aperturaAt).map(
    comoMovimiento,
  );
}

export async function leerInventario(
  r: R,
  s: { businessId: BusinessId; userId: UserId; deviceId: string; hoy: string },
): Promise<InventarioLeido> {
  const [e, m] = await Promise.all([
    existencias(r, s.businessId),
    delTurnoAbierto(r, s.businessId, s.userId, s.deviceId, s.hoy),
  ]);
  return { existencias: e, movimientos: m };
}
