/**
 * CancelacionLog — immutable audit trail for sale cancellations.
 *
 * One record per cancellation, never deleted. Tracks who cancelled,
 * why, the original sale details, whether cash was returned, and
 * whether stock was reversed.
 */

import { z } from 'zod';
import type {
  CancelacionLogId,
  ProductId,
  SaleId,
  UserId,
  BusinessId,
} from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { moneyField } from './_fields.js';
import { PaymentMethodEnum } from './sale.js';

export const CancelacionLogSchema = z
  .object({
    id: ulidField<CancelacionLogId>(),
    saleId: ulidField<SaleId>(),
    cancelledByUserId: ulidField<UserId>(),
    motivo: z.string().min(1).max(500),
    montoOriginalCentavos: moneyField,
    metodoOriginal: PaymentMethodEnum,
    /** Cash returned to customer (centavos). Null if not a cash sale. */
    cashReturnedCentavos: moneyField.nullable().default(null),
    /** Whether stock was reversed (entrada created). */
    stockReversed: z.boolean().default(false),
    /** Quantity returned to inventory. Null if no stock reversal. */
    cantidadDevuelta: z.number().int().nullable().default(null),
    /** Product whose stock was reversed. Null if no stock reversal. */
    productoId: ulidField<ProductId>().nullable().default(null),
  })
  .merge(auditSchema);

export type CancelacionLog = z.infer<typeof CancelacionLogSchema>;

/** Input for creating a cancellation log entry. */
export const NewCancelacionLogSchema = z.object({
  saleId: ulidField<SaleId>(),
  cancelledByUserId: ulidField<UserId>(),
  motivo: z.string().min(1).max(500),
  montoOriginalCentavos: moneyField,
  metodoOriginal: PaymentMethodEnum,
  cashReturnedCentavos: moneyField.nullable().default(null),
  stockReversed: z.boolean().default(false),
  cantidadDevuelta: z.number().int().nullable().default(null),
  productoId: ulidField<ProductId>().nullable().default(null),
  businessId: ulidField<BusinessId>(),
});

export type NewCancelacionLog = z.infer<typeof NewCancelacionLogSchema>;
