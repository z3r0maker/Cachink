/**
 * RecurringExpenses (GastoRecurrente) — templates that auto-generate
 * Egresos on a semanal / quincenal / mensual cadence. App-layer code
 * enforces the frecuencia ↔ day-of-week / day-of-month binding.
 */

import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit.js';

export const recurringExpenses = sqliteTable('recurring_expenses', {
  id: text('id').primaryKey(),
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
  montoCentavos: numeric('monto_centavos', { mode: 'bigint' }).notNull(),
  proveedor: text('proveedor'),
  frecuencia: text('frecuencia', {
    enum: ['semanal', 'quincenal', 'mensual'],
  }).notNull(),
  diaDelMes: integer('dia_del_mes'),
  diaDeLaSemana: integer('dia_de_la_semana'),
  proximoDisparo: text('proximo_disparo').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  ...auditColumns,
});
