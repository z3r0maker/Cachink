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
import type { BusinessId, CajaTurnoId, ClientId, ClientPaymentId } from '../ids/index.js';
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
    /**
     * The turno whose drawer received it (ADR-146), as a gasto carries its
     * own: the expected cash counts an abono only in that turno. Null when
     * no turno was open, and on every row written before the column existed.
     */
    cajaTurnoId: ulidField<CajaTurnoId>().nullable().default(null),
  })
  .merge(auditSchema);

export type ClientPayment = z.infer<typeof ClientPaymentSchema>;

export const NewClientPaymentSchema = z.object({
  clienteId: ulidField<ClientId>(),
  fecha: isoDateField,
  montoCentavos: moneyField,
  metodo: PaymentMethodEnum,
  nota: z.string().max(500).optional(),
  /** The open turno that receives it (ADR-146); absent when none is open. */
  cajaTurnoId: ulidField<CajaTurnoId>().nullish(),
  businessId: ulidField<BusinessId>(),
});

export type NewClientPayment = z.infer<typeof NewClientPaymentSchema>;
