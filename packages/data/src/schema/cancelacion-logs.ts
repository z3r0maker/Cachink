/**
 * CancelacionLogs table — immutable audit trail for sale cancellations.
 *
 * Part of the Cancelaciones y Devoluciones feature.
 */

import { integer, sqliteTable, text, numeric } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const cancelacionLogs = sqliteTable('cancelacion_logs', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull(),
  cancelledByUserId: text('cancelled_by_user_id').notNull(),
  motivo: text('motivo').notNull(),
  montoOriginalCentavos: numeric('monto_original_centavos', { mode: 'bigint' }).notNull(),
  metodoOriginal: text('metodo_original', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  cashReturnedCentavos: numeric('cash_returned_centavos', { mode: 'bigint' }),
  stockReversed: integer('stock_reversed', { mode: 'boolean' }).notNull().default(false),
  cantidadDevuelta: integer('cantidad_devuelta'),
  productoId: text('producto_id'),
  ...auditColumns,
});
