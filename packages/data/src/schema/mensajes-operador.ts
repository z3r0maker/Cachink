/**
 * MensajesOperador — owner→operator messages (ADR-075). DOWN table: the
 * portal writes them («Pedir aclaración»), every device pulls them; read
 * marks are device-local and never sync.
 */

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const mensajesOperador = sqliteTable('mensajes_operador', {
  id: text('id').primaryKey(),
  operadorId: text('operador_id').notNull(),
  cajaTurnoId: text('caja_turno_id'),
  severidad: text('severidad', { enum: ['info', 'aclaracion'] }).notNull(),
  cuerpo: text('cuerpo').notNull(),
  ...auditColumns,
});
