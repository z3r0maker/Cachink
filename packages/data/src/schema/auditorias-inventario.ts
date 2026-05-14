/**
 * AuditoriasInventario table — physical inventory count records.
 * Phase 10 of the Feature Flags plan.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const auditoriasInventario = sqliteTable('auditorias_inventario', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  estado: text('estado', { enum: ['borrador', 'finalizada'] }).notNull(),
  lineas: text('lineas').notNull(),
  totalDiscrepancias: integer('total_discrepancias').notNull().default(0),
  totalProductos: integer('total_productos').notNull(),
  productosContados: integer('productos_contados').notNull().default(0),
  ...auditColumns,
});
