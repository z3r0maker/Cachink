/**
 * Boundary validation of a subscription payment (defence-in-depth: the
 * webhook handler maps Stripe's payload, this re-checks it).
 */

import { z } from 'zod';
import { CfdiError } from './errors.js';
import type { SubscriptionPayment } from './types.js';

const paymentSchema = z.object({
  externalId: z.string().trim().min(1).max(255),
  tenantId: z.string().trim().min(1),
  totalCentavos: z.bigint().positive(),
  currency: z.string(),
  paidAt: z.date().refine((d) => !Number.isNaN(d.getTime())),
  method: z.enum(['card', 'spei']),
  cardFunding: z.enum(['credit', 'debit', 'prepaid', 'unknown']).optional(),
  description: z.string().trim().min(1).max(1000),
});

export function validatePayment(payment: SubscriptionPayment): SubscriptionPayment {
  const parsed = paymentSchema.safeParse(payment);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new CfdiError('CFDI_INVALID_PAYMENT', `Pago inválido (${fields})`);
  }
  if (parsed.data.currency.toUpperCase() !== 'MXN') {
    throw new CfdiError(
      'CFDI_UNSUPPORTED_CURRENCY',
      `Solo se factura en MXN; el pago ${parsed.data.externalId} es ${parsed.data.currency}`,
    );
  }
  return { ...parsed.data, currency: 'MXN' };
}
