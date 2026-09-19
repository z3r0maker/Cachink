/**
 * Tickets — the sale header (ADR-073): folio (per-device counter, unique on
 * (device, folio)), method, client, cash tendered/change, the turno and the
 * cancellation. Written by `RegistrarTicketUseCase` atomically with its
 * lines; `sales.ticket_id` points here.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  folio: integer('folio').notNull(),
  fecha: text('fecha').notNull(),
  /** "HH:MM" device time at capture. Null for migrated rows. */
  hora: text('hora'),
  concepto: text('concepto').notNull(),
  metodo: text('metodo', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  clienteId: text('cliente_id'),
  estadoPago: text('estado_pago', {
    enum: ['pagado', 'pendiente', 'parcial'],
  }).notNull(),
  /** Cash received (centavos). Only for Efectivo; change = recibido − total. */
  efectivoRecibidoCentavos: numeric('efectivo_recibido_centavos', { mode: 'bigint' }),
  cambioCentavos: numeric('cambio_centavos', { mode: 'bigint' }),
  cajaTurnoId: text('caja_turno_id'),
  cancelMotivo: text('cancel_motivo'),
  cancelledByUserId: text('cancelled_by_user_id'),
  cancelledAt: text('cancelled_at'),
  ...auditColumns,
});
