/**
 * The register's inventory (O-24 live): the business's stocked products with
 * their stock from the ledger (`sumStock`, retention baseline included), this
 * turno's manual movements, and the write through
 * `RegistrarMovimientoInventarioUseCase` — which, for an entrada, also records
 * the purchase expense at cost × quantity (no caja turno, so the expected cash
 * never sees it: the goods may have been paid from elsewhere).
 */

import { RegistrarMovimientoInventarioUseCase } from '@xangarro/application';
import {
  DrizzleCajaTurnosRepository,
  DrizzleExpensesRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleProductsRepository,
} from '@xangarro/data';
import type { BusinessId } from '@xangarro/domain';

import { hoyLocal } from '@xangarro/caja';
import type { Db } from './db-types';
import {
  delTurno,
  movimientoDominio,
  type ExistenciaPara,
  type FilaMovimiento,
  type InventarioPara,
  type InventarioRequest,
  type MovimientoInventarioPara as MovimientoPara,
} from '@xangarro/caja/lectura';

interface Producto {
  readonly id: string;
  readonly nombre: string;
  readonly seguirStock: boolean;
  readonly deletedAt: string | null;
  readonly estadoRevision: string;
}

/** Stock is the screen's only when tracked, alive and not awaiting review. */
export const seSigue = (p: Producto): boolean =>
  p.seguirStock && p.deletedAt === null && p.estadoRevision !== 'pendiente';

/** Each tracked product's stock and threshold, keyed by product id (the caja's chips). */
export async function stockPorProducto(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<ReadonlyMap<string, { existencias: number; umbral: number }>> {
  const productos = await new DrizzleProductsRepository(
    db as never,
    deviceId as never,
  ).listForBusiness(businessId);
  const movs = new DrizzleInventoryMovementsRepository(db as never, deviceId as never);
  const out = new Map<string, { existencias: number; umbral: number }>();
  for (const p of productos.filter(seSigue)) {
    out.set(p.id, { existencias: await movs.sumStock(p.id), umbral: p.umbralStockBajo });
  }
  return out;
}

/** This turno's manual movements on this device (empty when the turno is gone). */
export async function movimientosDelTurno(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  turnoId: string,
): Promise<readonly MovimientoPara[]> {
  const turno = await new DrizzleCajaTurnosRepository(db as never, deviceId as never).findById(
    turnoId as never,
  );
  if (turno === null) return [];
  const rows = await new DrizzleInventoryMovementsRepository(
    db as never,
    deviceId as never,
  ).findByDateRange(turno.fecha, hoyLocal() as never, businessId);
  return delTurno(rows as unknown as readonly FilaMovimiento[], deviceId, turno.aperturaAt);
}

/** The Inventario screen's read: stocked products and this turno's movements. */
export async function inventarioDelTurno(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  turnoId: string,
): Promise<InventarioPara> {
  const productos = await new DrizzleProductsRepository(
    db as never,
    deviceId as never,
  ).listForBusiness(businessId);
  const movs = new DrizzleInventoryMovementsRepository(db as never, deviceId as never);
  const existencias: ExistenciaPara[] = [];
  for (const p of productos.filter(seSigue)) {
    existencias.push({
      id: p.id,
      nombre: p.nombre,
      existencias: await movs.sumStock(p.id),
      umbral: p.umbralStockBajo,
      unidad: p.unidad,
      icono: p.icono,
      color: p.colorFondo,
      categoria: p.categoria,
    });
  }
  existencias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
  return {
    existencias,
    movimientos: await movimientosDelTurno(db, businessId, deviceId, turnoId),
  };
}

/** Record an entrada or a merma through the real use case, at the product's cost. */
export async function moverInventario(
  db: Db,
  p: {
    readonly businessId: BusinessId;
    readonly deviceId: string;
    readonly userId: string;
    readonly productoId: string;
    readonly tipo: 'Entrada' | 'Merma';
    readonly cantidad: number;
    readonly detalle: string;
  },
): Promise<{ readonly id: string }> {
  const producto = await new DrizzleProductsRepository(db as never, p.deviceId as never).findById(
    p.productoId as never,
  );
  if (producto === null) throw new Error('producto no encontrado');
  const useCase = new RegistrarMovimientoInventarioUseCase(
    new DrizzleInventoryMovementsRepository(db as never, p.deviceId as never, p.userId as never),
    new DrizzleExpensesRepository(db as never, p.deviceId as never, p.userId as never),
  );
  const m = await useCase.execute({
    ...movimientoDominio(p.tipo, p.cantidad, p.detalle),
    productoId: producto.id,
    fecha: hoyLocal() as never,
    costoUnitCentavos: producto.costoUnitCentavos,
    origen: 'manual',
    businessId: p.businessId,
  });
  return { id: m.id };
}

/** The router's entry for both inventory methods (kept here: router.ts is at budget). */
export function porInventario(
  request: InventarioRequest,
  rt: { readonly db: Db },
): Promise<unknown> {
  if (request.method === 'inventario') {
    return inventarioDelTurno(
      rt.db,
      request.businessId as never,
      request.deviceId,
      request.turnoId,
    );
  }
  return moverInventario(rt.db, {
    businessId: request.businessId as never,
    deviceId: request.deviceId,
    userId: request.userId,
    productoId: request.productoId,
    tipo: request.tipo,
    cantidad: request.cantidad,
    detalle: request.detalle,
  });
}
