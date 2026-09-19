/**
 * Clients — minimal-on-purpose per CLAUDE.md §9. Enables the Crédito
 * payment method and the Cuentas por Cobrar view.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono'),
  email: text('email'),
  nota: text('nota'),
  limiteCentavos: numeric('limite_centavos', { mode: 'bigint' }),
  plazoDias: integer('plazo_dias'),
  estadoRevision: text('estado_revision', {
    enum: ['pendiente', 'aprobado', 'fusionado', 'rechazado'],
  })
    .notNull()
    .default('aprobado'),
  fusionadoConId: text('fusionado_con_id'),
  ...auditColumns,
});
