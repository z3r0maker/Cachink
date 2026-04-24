/**
 * Employees — simple payroll records (Phase 1 keeps it minimal per
 * CLAUDE.md §13; no IMSS / ISR withholding math).
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  puesto: text('puesto').notNull(),
  salarioCentavos: numeric('salario_centavos', { mode: 'bigint' }).notNull(),
  periodo: text('periodo', {
    enum: ['semanal', 'quincenal', 'mensual'],
  }).notNull(),
  ...auditColumns,
});
