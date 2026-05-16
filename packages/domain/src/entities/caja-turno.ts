/**
 * CajaTurno — cash drawer turn record.
 *
 * Each turn has an apertura (opening) and optional cierre (closing).
 * When closed, the system computes expected vs counted cash and records
 * any discrepancy with a reason.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import { z } from 'zod';
import type { BusinessId, CajaTurnoId, ExpenseId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema, isoTimestampField } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';

export const DiscrepancyReasonEnum = z.enum([
  'gasto-no-registrado',
  'error-en-cambio',
  'retiro-autorizado',
  'faltante-sin-explicacion',
  'sobrante',
  'otro',
]);
export type DiscrepancyReason = z.infer<typeof DiscrepancyReasonEnum>;

export const CajaTurnoSchema = z
  .object({
    id: ulidField<CajaTurnoId>(),
    userId: ulidField<UserId>(),
    fecha: isoDateField,
    aperturaAt: isoTimestampField,
    cierreAt: isoTimestampField.nullable(),
    montoAperturaCentavos: moneyField,
    efectivoAdicionalCentavos: moneyField,
    montoCierreCentavos: moneyField.nullable(),
    efectivoEsperadoCentavos: moneyField.nullable(),
    diferenciaCentavos: moneyField.nullable(),
    discrepancyReason: DiscrepancyReasonEnum.nullable(),
    explicacion: z.string().max(500).nullable(),
    totalTransferencias: moneyField,
    totalTarjeta: moneyField,
    totalQr: moneyField,
    totalCredito: moneyField,
    egresoAutoId: ulidField<ExpenseId>().nullable(),
    /** Blind-count amount entered by operator (centavos). Locked on submit. */
    conteoCentavos: moneyField.nullable().default(null),
    /** ISO timestamp when the blind count was submitted. */
    conteoAt: isoTimestampField.nullable().default(null),
  })
  .merge(auditSchema);

export type CajaTurno = z.infer<typeof CajaTurnoSchema>;

/** Input for opening a new cash drawer turn. */
export const NewCajaTurnoSchema = z.object({
  userId: ulidField<UserId>(),
  fecha: isoDateField,
  montoAperturaCentavos: moneyField,
  efectivoAdicionalCentavos: moneyField.default(0n),
  businessId: ulidField<BusinessId>(),
});

export type NewCajaTurno = z.infer<typeof NewCajaTurnoSchema>;

/** Input for closing an open turn. */
export const CerrarCajaSchema = z.object({
  turnoId: ulidField<CajaTurnoId>(),
  montoCierreCentavos: moneyField,
  discrepancyReason: DiscrepancyReasonEnum.nullable(),
  explicacion: z.string().max(500).nullable(),
});

export type CerrarCajaInput = z.infer<typeof CerrarCajaSchema>;
