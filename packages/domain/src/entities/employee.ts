/**
 * Employee (Empleado) — a payroll record. Phase 1 keeps this dead simple:
 * a fixed salary per period with no IMSS / ISR withholding math. See
 * CLAUDE.md §13 — advanced payroll is deferred to Phase 2+.
 */

import { z } from 'zod';
import type { BusinessId, EmployeeId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { moneyField } from './_fields.js';

export const PayrollFrequencyEnum = z.enum(['semanal', 'quincenal', 'mensual']);
export type PayrollFrequency = z.infer<typeof PayrollFrequencyEnum>;

export const EmployeeSchema = z
  .object({
    id: ulidField<EmployeeId>(),
    nombre: z.string().min(1).max(120),
    puesto: z.string().min(1).max(80),
    salarioCentavos: moneyField,
    periodo: PayrollFrequencyEnum,
  })
  .merge(auditSchema);

export type Employee = z.infer<typeof EmployeeSchema>;

export const NewEmployeeSchema = z.object({
  nombre: z.string().min(1).max(120),
  puesto: z.string().min(1).max(80),
  salarioCentavos: moneyField,
  periodo: PayrollFrequencyEnum,
  businessId: ulidField<BusinessId>(),
});

export type NewEmployee = z.infer<typeof NewEmployeeSchema>;
