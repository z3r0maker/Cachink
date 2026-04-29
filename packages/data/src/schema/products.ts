/**
 * Products — the catalogue. Stock levels are derived from
 * `inventory_movements`, not stored here; `umbral_stock_bajo` defaults to 3.
 *
 * UXD-R3 additions (ADR-043):
 *   - `tipo` — 'producto' | 'servicio' discriminator.
 *   - `seguir_stock` — opt-in stock tracking (INTEGER 0/1).
 *   - `precio_venta_centavos` — required for quick-sell.
 *   - `atributos` — JSON string of sparse {clave: valor} map.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

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
  tipo: text('tipo', { enum: ['producto', 'servicio'] }).notNull().default('producto'),
  seguirStock: integer('seguir_stock', { mode: 'boolean' }).notNull().default(true),
  precioVentaCentavos: numeric('precio_venta_centavos', { mode: 'bigint' }).notNull().default(0n),
  atributos: text('atributos').notNull().default('{}'),
  ...auditColumns,
});
