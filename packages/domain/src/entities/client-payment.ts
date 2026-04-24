/**
 * ClientPayment (PagoCliente) — a partial or full payment against a Crédito
 * Sale. Summing these against the Sale's `monto` drives the `estadoPago`
 * transition (pendiente → parcial → pagado) and the "Cuentas por cobrar"
 * view (CLAUDE.md §9).
 *
 * Re-uses `PaymentMethodEnum` from `sale.ts` — the same five methods are
 * valid for a client payment.
 */

import { z } from 'zod';
import type { BusinessId, ClientPaymentId, SaleId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';
import { PaymentMethodEnum } from './sale.js';

export const ClientPaymentSchema = z
  .object({
    id: ulidField<ClientPaymentId>(),
    ventaId: ulidField<SaleId>(),
    fecha: isoDateField,
    montoCentavos: moneyField,
    metodo: PaymentMethodEnum,
    nota: z.string().max(500).nullable(),
  })
  .merge(auditSchema);

export type ClientPayment = z.infer<typeof ClientPaymentSchema>;

export const NewClientPaymentSchema = z.object({
  ventaId: ulidField<SaleId>(),
  fecha: isoDateField,
  montoCentavos: moneyField,
  metodo: PaymentMethodEnum,
  nota: z.string().max(500).optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewClientPayment = z.infer<typeof NewClientPaymentSchema>;
