/**
 * Conversions table — executed conversion records.
 * Phase 8 of the Feature Flags plan.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const conversions = sqliteTable('conversions', {
  id: text('id').primaryKey(),
  recetaId: text('receta_id').notNull(),
  materiaPrimaId: text('materia_prima_id').notNull(),
  productoResultanteId: text('producto_resultante_id').notNull(),
  cantidadOrigenUsada: integer('cantidad_origen_usada').notNull(),
  cantidadResultanteCreada: integer('cantidad_resultante_creada').notNull(),
  movimientoSalidaId: text('movimiento_salida_id').notNull(),
  movimientoEntradaId: text('movimiento_entrada_id').notNull(),
  ...auditColumns,
});
