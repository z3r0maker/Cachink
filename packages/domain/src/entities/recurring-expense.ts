/**
 * RecurringExpense (GastoRecurrente) — template that auto-generates Egresos
 * on a semanal / quincenal / mensual cadence (CLAUDE.md §1). When
 * `proximoDisparo <= today`, the UI surfaces a "Pendiente de registrar"
 * card; confirming creates an Expense and advances `proximoDisparo`.
 *
 * Cross-field refine enforces that the day-of-week / day-of-month field
 * matches the selected frecuencia.
 */

import { z } from 'zod';
import type { BusinessId, RecurringExpenseId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';
import { ExpenseCategoryEnum } from './expense.js';

export const RecurrenceFrequencyEnum = z.enum(['semanal', 'quincenal', 'mensual']);
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequencyEnum>;

const baseShape = {
  id: ulidField<RecurringExpenseId>(),
  concepto: z.string().min(1).max(200),
  categoria: ExpenseCategoryEnum,
  montoCentavos: moneyField,
  proveedor: z.string().min(1).max(120).nullable(),
  frecuencia: RecurrenceFrequencyEnum,
  diaDelMes: z.number().int().min(1).max(31).nullable(),
  diaDeLaSemana: z.number().int().min(0).max(6).nullable(),
  proximoDisparo: isoDateField,
  activo: z.boolean(),
};

function matchesFrequency(v: {
  frecuencia: RecurrenceFrequency;
  diaDelMes: number | null;
  diaDeLaSemana: number | null;
}): boolean {
  if (v.frecuencia === 'semanal') return v.diaDeLaSemana !== null;
  if (v.frecuencia === 'mensual') return v.diaDelMes !== null;
  // quincenal: either field may carry the schedule
  return v.diaDeLaSemana !== null || v.diaDelMes !== null;
}

export const RecurringExpenseSchema = z
  .object(baseShape)
  .merge(auditSchema)
  .refine(matchesFrequency, {
    message:
      'frecuencia requires the matching day field: semanal needs diaDeLaSemana, mensual needs diaDelMes, quincenal needs either',
    path: ['frecuencia'],
  });

export type RecurringExpense = z.infer<typeof RecurringExpenseSchema>;

export const NewRecurringExpenseSchema = z
  .object({
    concepto: z.string().min(1).max(200),
    categoria: ExpenseCategoryEnum,
    montoCentavos: moneyField,
    proveedor: z.string().min(1).max(120).optional(),
    frecuencia: RecurrenceFrequencyEnum,
    diaDelMes: z.number().int().min(1).max(31).optional(),
    diaDeLaSemana: z.number().int().min(0).max(6).optional(),
    proximoDisparo: isoDateField,
    activo: z.boolean().default(true),
    businessId: ulidField<BusinessId>(),
  })
  .refine(
    (v) =>
      matchesFrequency({
        frecuencia: v.frecuencia,
        diaDelMes: v.diaDelMes ?? null,
        diaDeLaSemana: v.diaDeLaSemana ?? null,
      }),
    {
      message:
        'frecuencia requires the matching day field: semanal needs diaDeLaSemana, mensual needs diaDelMes, quincenal needs either',
      path: ['frecuencia'],
    },
  );

export type NewRecurringExpense = z.infer<typeof NewRecurringExpenseSchema>;
