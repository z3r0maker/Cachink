/**
 * InventoryMovements — the append-only ledger for stock changes. `cantidad`
 * is a positive INTEGER (direction is carried by `tipo`). App-layer code
 * enforces the `motivo` ↔ `tipo` binding; SQLite stores `motivo` as free
 * TEXT because the allowed values differ per tipo.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit.js';

export const inventoryMovements = sqliteTable('inventory_movements', {
  id: text('id').primaryKey(),
  productoId: text('producto_id').notNull(),
  fecha: text('fecha').notNull(),
  tipo: text('tipo', { enum: ['entrada', 'salida'] }).notNull(),
  cantidad: integer('cantidad').notNull(),
  costoUnitCentavos: numeric('costo_unit_centavos', { mode: 'bigint' }).notNull(),
  motivo: text('motivo').notNull(),
  nota: text('nota'),
  ...auditColumns,
});
