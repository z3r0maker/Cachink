/**
 * Sales — core transactional table. `monto_centavos` stored as INTEGER with
 * bigint mode so the CLAUDE.md §2 principle 8 (no floats for money) holds
 * end-to-end. Enum columns match the Zod `PaymentMethodEnum`,
 * `SaleCategoryEnum`, and `PaymentStateEnum` literal tuples.
 *
 * `producto_id` is **required** — every sale references a catalogue producto
 * (ADR-048: product-only sales). `cantidad` defaults to 1.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  /** "HH:MM" device time at sale creation. Null for pre-PR-7 records. */
  hora: text('hora'),
  concepto: text('concepto').notNull(),
  categoria: text('categoria', {
    enum: ['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro'],
  }).notNull(),
  monto: numeric('monto_centavos', { mode: 'bigint' }).notNull(),
  metodo: text('metodo', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  clienteId: text('cliente_id'),
  estadoPago: text('estado_pago', {
    enum: ['pagado', 'pendiente', 'parcial'],
  }).notNull(),
  productoId: text('producto_id').notNull(),
  cantidad: integer('cantidad').notNull().default(1),
  /** Cash received from customer (centavos). Only set for Efectivo sales. */
  efectivoRecibidoCentavos: numeric('efectivo_recibido_centavos', { mode: 'bigint' }),
  /** UserId who cancelled this sale. Null if not cancelled. */
  cancelledByUserId: text('cancelled_by_user_id'),
  /** Reason for cancellation. */
  cancelMotivo: text('cancel_motivo'),
  /** ISO timestamp when this sale was cancelled. */
  cancelledAt: text('cancelled_at'),
  /** CajaTurno ID active at time of sale. Null only for pre-migration legacy rows. */
  cajaTurnoId: text('caja_turno_id'),
  ...auditColumns,
});
