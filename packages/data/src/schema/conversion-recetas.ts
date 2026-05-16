/**
 * ConversionRecetas table — recipe definitions.
 * Phase 8 of the Feature Flags plan.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const conversionRecetas = sqliteTable('conversion_recetas', {
  id: text('id').primaryKey(),
  materiaPrimaId: text('materia_prima_id').notNull(),
  productoResultanteId: text('producto_resultante_id').notNull(),
  cantidadOrigen: integer('cantidad_origen').notNull(),
  cantidadResultante: integer('cantidad_resultante').notNull(),
  ...auditColumns,
});
