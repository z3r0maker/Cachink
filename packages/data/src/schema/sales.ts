/**
 * Sales — a ticket's lines (ADR-073): product, quantity, amount. The
 * ticket-level facts (folio, method, client, payment state, cancellation,
 * turno) live in `tickets`. `monto_centavos` is INTEGER bigint mode so the
 * no-floats rule (CLAUDE.md §2.8) holds end-to-end. `fecha` is copied from
 * the ticket at capture and immutable.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull(),
  fecha: text('fecha').notNull(),
  concepto: text('concepto').notNull(),
  categoria: text('categoria', {
    enum: ['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro'],
  }).notNull(),
  monto: numeric('monto_centavos', { mode: 'bigint' }).notNull(),
  productoId: text('producto_id').notNull(),
  cantidad: integer('cantidad').notNull().default(1),
  ...auditColumns,
});
