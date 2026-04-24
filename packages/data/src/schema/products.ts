/**
 * Products — the inventariable catalogue. Stock levels are derived from
 * `inventory_movements`, not stored here; `umbral_stock_bajo` defaults to 3.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit.js';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  sku: text('sku'),
  categoria: text('categoria', {
    enum: ['Materia Prima', 'Producto Terminado', 'Empaque', 'Herramienta', 'Insumo', 'Otro'],
  }).notNull(),
  costoUnitCentavos: numeric('costo_unit_centavos', { mode: 'bigint' }).notNull(),
  unidad: text('unidad', {
    enum: ['pza', 'kg', 'lt', 'm', 'caja', 'bolsa', 'rollo', 'par', 'otro'],
  }).notNull(),
  umbralStockBajo: integer('umbral_stock_bajo').notNull().default(3),
  ...auditColumns,
});
