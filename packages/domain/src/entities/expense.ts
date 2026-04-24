/**
 * Expense (Egreso) — money going out: gastos operativos, nómina,
 * compras de inventario. Categories match EGRESO_CAT in CLAUDE.md §9.
 *
 * `gastoRecurrenteId` is set when the Egreso was auto-generated from a
 * GastoRecurrente template (CLAUDE.md §1 — recurring entries). It stays
 * null for ad-hoc egresos.
 */

import { z } from 'zod';
import type { BusinessId, ExpenseId, RecurringExpenseId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';

export const ExpenseCategoryEnum = z.enum([
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
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const ExpenseSchema = z
  .object({
    id: ulidField<ExpenseId>(),
    fecha: isoDateField,
    concepto: z.string().min(1).max(200),
    categoria: ExpenseCategoryEnum,
    monto: moneyField,
    proveedor: z.string().min(1).max(120).nullable(),
    gastoRecurrenteId: ulidField<RecurringExpenseId>().nullable(),
  })
  .merge(auditSchema);

export type Expense = z.infer<typeof ExpenseSchema>;

export const NewExpenseSchema = z.object({
  fecha: isoDateField,
  concepto: z.string().min(1).max(200),
  categoria: ExpenseCategoryEnum,
  monto: moneyField,
  proveedor: z.string().min(1).max(120).optional(),
  gastoRecurrenteId: ulidField<RecurringExpenseId>().optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewExpense = z.infer<typeof NewExpenseSchema>;
