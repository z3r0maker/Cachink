/**
 * Row → entity mapping for sales. Split from sales-repository.ts to keep it
 * under the 200-line cap (CLAUDE.md §2.6).
 */

import type {
  BusinessId,
  CajaTurnoId,
  ClientId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  Money,
  ProductId,
  Sale,
  SaleCategory,
  SaleId,
  UserId,
} from '@xangarro/domain';
import type { sales } from '../../schema/index.js';

export type SaleRow = typeof sales.$inferSelect;

export function mapSaleRow(row: SaleRow): Sale {
  return {
    id: row.id as SaleId,
    fecha: row.fecha as IsoDate,
    hora: row.hora ?? null,
    concepto: row.concepto,
    categoria: row.categoria as SaleCategory,
    monto: row.monto,
    metodo: row.metodo,
    clienteId: (row.clienteId ?? null) as ClientId | null,
    estadoPago: row.estadoPago,
    productoId: row.productoId as ProductId,
    cantidad: row.cantidad,
    efectivoRecibidoCentavos: (row.efectivoRecibidoCentavos ?? null) as Money | null,
    cancelledByUserId: (row.cancelledByUserId ?? null) as UserId | null,
    cancelMotivo: row.cancelMotivo ?? null,
    cancelledAt: (row.cancelledAt ?? null) as IsoTimestamp | null,
    cajaTurnoId: (row.cajaTurnoId ?? null) as CajaTurnoId | null,
    businessId: row.businessId as BusinessId,
    deviceId: row.deviceId as DeviceId,
    createdByUserId: (row.createdByUserId ?? null) as UserId | null,
    createdAt: row.createdAt as IsoTimestamp,
    updatedAt: row.updatedAt as IsoTimestamp,
    deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
  };
}
