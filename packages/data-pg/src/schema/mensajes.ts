/**
 * Owner↔operator messages (ADR-075, C-19).
 *
 * `mensajes_operador` is DOWN: the portal writes («Pedir aclaración» from
 * Cortes de turno), every device pulls. `respuestas_operador` is UP: the
 * device writes from the Avisos reply box and pushes once. Both mirror the
 * device's SQLite columns exactly (drift test).
 */

import { pgTable, text } from 'drizzle-orm/pg-core';
import { auditColumns } from './_columns';

export const mensajesOperador = pgTable('mensajes_operador', {
  id: text('id').primaryKey(),
  operadorId: text('operador_id').notNull(),
  cajaTurnoId: text('caja_turno_id'),
  severidad: text('severidad', { enum: ['info', 'aclaracion'] }).notNull(),
  cuerpo: text('cuerpo').notNull(),
  ...auditColumns,
});

export const respuestasOperador = pgTable('respuestas_operador', {
  id: text('id').primaryKey(),
  mensajeId: text('mensaje_id').notNull(),
  texto: text('texto').notNull(),
  ...auditColumns,
});
