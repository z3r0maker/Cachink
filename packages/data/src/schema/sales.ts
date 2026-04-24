/**
 * Sales — core transactional table. `monto_centavos` stored as INTEGER with
 * bigint mode so the CLAUDE.md §2 principle 8 (no floats for money) holds
 * end-to-end. Enum columns match the Zod `PaymentMethodEnum`,
 * `SaleCategoryEnum`, and `PaymentStateEnum` literal tuples.
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
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
  ...auditColumns,
});
