/**
 * DayCloses (CorteDeDia) — nightly cash reconciliation. One row per device
 * per day (enforced at the app layer). `diferencia_centavos` stored
 * explicitly so reports don't have to recompute it every time.
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit.js';

export const dayCloses = sqliteTable('day_closes', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  efectivoEsperadoCentavos: numeric('efectivo_esperado_centavos', {
    mode: 'bigint',
  }).notNull(),
  efectivoContadoCentavos: numeric('efectivo_contado_centavos', {
    mode: 'bigint',
  }).notNull(),
  diferenciaCentavos: numeric('diferencia_centavos', {
    mode: 'bigint',
  }).notNull(),
  explicacion: text('explicacion'),
  cerradoPor: text('cerrado_por', {
    enum: ['Operativo', 'Director'],
  }).notNull(),
  ...auditColumns,
});
