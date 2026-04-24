/**
 * DayClose (CorteDeDia) — nightly cash reconciliation. One record per device
 * per day (CLAUDE.md §1). `diferenciaCentavos` is derived and cross-checked
 * so data-entry bugs are caught at schema parse time.
 *
 * Math (CLAUDE.md §10):
 *   diferencia = efectivoContado - efectivoEsperado
 */

import { z } from 'zod';
import type { BusinessId, DayCloseId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';

export const DayCloseRoleEnum = z.enum(['Operativo', 'Director']);
export type DayCloseRole = z.infer<typeof DayCloseRoleEnum>;

export const DayCloseSchema = z
  .object({
    id: ulidField<DayCloseId>(),
    fecha: isoDateField,
    efectivoEsperadoCentavos: moneyField,
    efectivoContadoCentavos: moneyField,
    diferenciaCentavos: moneyField,
    explicacion: z.string().max(500).nullable(),
    cerradoPor: DayCloseRoleEnum,
  })
  .merge(auditSchema)
  .refine((v) => v.diferenciaCentavos === v.efectivoContadoCentavos - v.efectivoEsperadoCentavos, {
    message: 'diferenciaCentavos must equal efectivoContadoCentavos - efectivoEsperadoCentavos',
    path: ['diferenciaCentavos'],
  });

export type DayClose = z.infer<typeof DayCloseSchema>;

export const NewDayCloseSchema = z.object({
  fecha: isoDateField,
  efectivoEsperadoCentavos: moneyField,
  efectivoContadoCentavos: moneyField,
  explicacion: z.string().max(500).optional(),
  cerradoPor: DayCloseRoleEnum,
  businessId: ulidField<BusinessId>(),
});

export type NewDayClose = z.infer<typeof NewDayCloseSchema>;
