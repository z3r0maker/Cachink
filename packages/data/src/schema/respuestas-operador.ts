/**
 * RespuestasOperador — an operator's answer to a owner message (ADR-075).
 * UP table: written on the device from the Avisos reply box, pushed once.
 */

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const respuestasOperador = sqliteTable('respuestas_operador', {
  id: text('id').primaryKey(),
  mensajeId: text('mensaje_id').notNull(),
  texto: text('texto').notNull(),
  ...auditColumns,
});
