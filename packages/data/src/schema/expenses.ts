/**
 * Expenses — egresos (money out). Enum columns mirror ExpenseCategoryEnum;
 * `proveedor` is nullable, `gasto_recurrente_id` links rows auto-created
 * from a recurring template.
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  concepto: text('concepto').notNull(),
  categoria: text('categoria', {
    enum: [
      'Materia Prima',
      'Inventario',
      'Nómina',
      'Renta',
      'Servicios',
      'Publicidad',
      'Mantenimiento',
      'Impuestos',
      'Logística',
      'Otro',
    ],
  }).notNull(),
  monto: numeric('monto_centavos', { mode: 'bigint' }).notNull(),
  proveedor: text('proveedor'),
  gastoRecurrenteId: text('gasto_recurrente_id'),
  ...auditColumns,
});
