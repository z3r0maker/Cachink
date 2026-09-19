/**
 * Row → entity mapping for sale lines (ADR-073). Split from
 * sales-repository.ts to keep it under the 200-line cap (CLAUDE.md §2.6).
 */

import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  ProductId,
  Sale,
  SaleCategory,
  SaleId,
  TicketId,
  UserId,
} from '@xangarro/domain';
import type { sales } from '../../schema/index.js';

export type SaleRow = typeof sales.$inferSelect;

export function mapSaleRow(row: SaleRow): Sale {
  return {
    id: row.id as SaleId,
    ticketId: row.ticketId as TicketId,
    fecha: row.fecha as IsoDate,
    concepto: row.concepto,
    categoria: row.categoria as SaleCategory,
    monto: row.monto,
    productoId: row.productoId as ProductId,
    cantidad: row.cantidad,
    businessId: row.businessId as BusinessId,
    deviceId: row.deviceId as DeviceId,
    createdByUserId: (row.createdByUserId ?? null) as UserId | null,
    createdAt: row.createdAt as IsoTimestamp,
    updatedAt: row.updatedAt as IsoTimestamp,
    deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
  };
}
