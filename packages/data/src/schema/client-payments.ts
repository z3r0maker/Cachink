/**
 * ClientPayments — partial/full payments against a Crédito Sale. Summing
 * these against a Sale's `monto` drives the estadoPago transition and the
 * "Cuentas por cobrar" view.
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const clientPayments = sqliteTable('client_payments', {
  id: text('id').primaryKey(),
  ventaId: text('venta_id').notNull(),
  fecha: text('fecha').notNull(),
  montoCentavos: numeric('monto_centavos', { mode: 'bigint' }).notNull(),
  metodo: text('metodo', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  nota: text('nota'),
  ...auditColumns,
});
