/**
 * ClientPayment (Abono) — a payment from a client against their fiado
 * (ADR-074). An abono belongs to the **client**, not to one sale: how it
 * settles their tickets (oldest first) and their balance are derived by
 * `estadoDeCuenta` in `packages/domain/financials` — nothing stores a
 * balance.
 *
 * Re-uses `PaymentMethodEnum` from `sale.ts` — the same five methods are
 * valid for a client payment.
 */

import { z } from 'zod';
import type { BusinessId, ClientId, ClientPaymentId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';
import { PaymentMethodEnum } from './sale.js';

export const ClientPaymentSchema = z
  .object({
    id: ulidField<ClientPaymentId>(),
    clienteId: ulidField<ClientId>(),
    fecha: isoDateField,
    montoCentavos: moneyField,
    metodo: PaymentMethodEnum,
    nota: z.string().max(500).nullable(),
  })
  .merge(auditSchema);

export type ClientPayment = z.infer<typeof ClientPaymentSchema>;

export const NewClientPaymentSchema = z.object({
  clienteId: ulidField<ClientId>(),
  fecha: isoDateField,
  montoCentavos: moneyField,
  metodo: PaymentMethodEnum,
  nota: z.string().max(500).optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewClientPayment = z.infer<typeof NewClientPaymentSchema>;
