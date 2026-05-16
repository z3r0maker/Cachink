/**
 * EntregaCredito — grouped credit delivery record.
 *
 * Links multiple credit Sales to a single delivery event.
 * Phase 11 of the Feature Flags plan.
 */

import { z } from 'zod';
import type { ClientId, EntregaCreditoId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';

export const EntregaCreditoSchema = z
  .object({
    id: ulidField<EntregaCreditoId>(),
    clienteId: ulidField<ClientId>(),
    fecha: isoDateField,
    totalCentavos: moneyField,
    nota: z.string().max(500).nullable(),
    /** JSON-encoded SaleId[] in DB. */
    saleIds: z.string(),
  })
  .merge(auditSchema);

export type EntregaCredito = z.infer<typeof EntregaCreditoSchema>;
