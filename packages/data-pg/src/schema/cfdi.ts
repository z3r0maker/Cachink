/**
 * CFDI for Xangarro's own subscription payments (N-33, ADR-070). Portal-only.
 *
 * `cfdi_payments` is `IssuedCfdiRepository`'s store: one row per Stripe
 * invoice (the idempotency key), recorded on every `invoice.paid` whatever
 * `CFDI_MODE` says, so no payment is ever owed a CFDI without a row saying so.
 * `cfdi_globals` holds the monthly "público en general" CFDIs.
 *
 * Only `xangarro_billing` reads or writes them, and nobody deletes a row: a
 * cancelled CFDI is a status, not an absence (`0009_metering_cfdi_grants.sql`).
 */

import { bigint, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const CFDI_ROUTES = ['individual_pue', 'individual_ppd', 'global'] as const;
export const CFDI_STATUSES = [
  'manual',
  'claimed',
  'stamped',
  'pending_global',
  'in_global',
  'excluded_from_global',
  'cancel_requested',
  'cancelled',
] as const;
export const CFDI_GLOBAL_STATUSES = ['stamping', 'stamped'] as const;

export const cfdiPayments = pgTable(
  'cfdi_payments',
  {
    /** Stripe invoice id. */
    externalPaymentId: text('external_payment_id').primaryKey(),
    businessId: text('business_id').notNull(),
    route: text('route', { enum: CFDI_ROUTES }).notNull(),
    status: text('status', { enum: CFDI_STATUSES }).notNull(),
    /** IVA included. */
    totalCentavos: bigint('total_centavos', { mode: 'bigint' }).notNull(),
    paidAt: at('paid_at').notNull(),
    /** `'YYYY-MM'` in CDMX time. */
    period: text('period').notNull(),
    formaPago: text('forma_pago').notNull(),
    description: text('description').notNull(),
    /** Receptor snapshot (individual routes). */
    receptor: jsonb('receptor'),
    /** Why the payment went to the global CFDI (global route). */
    globalReasons: jsonb('global_reasons'),
    invoiceProviderId: text('invoice_provider_id'),
    invoiceUuid: text('invoice_uuid'),
    complementProviderId: text('complement_provider_id'),
    complementUuid: text('complement_uuid'),
    globalId: text('global_id'),
    cancellation: jsonb('cancellation'),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cfdi_payments_business_idx').on(t.businessId),
    index('cfdi_payments_period_status_idx').on(t.period, t.status, t.paidAt),
  ],
);

export const cfdiGlobals = pgTable(
  'cfdi_globals',
  {
    /** `${period}#${sequence}`. */
    id: text('id').primaryKey(),
    period: text('period').notNull(),
    sequence: bigint('sequence', { mode: 'number' }).notNull(),
    /** Frozen when the draft is created, so a retry stamps the same set. */
    paymentIds: jsonb('payment_ids').notNull(),
    status: text('status', { enum: CFDI_GLOBAL_STATUSES }).notNull(),
    invoiceProviderId: text('invoice_provider_id'),
    invoiceUuid: text('invoice_uuid'),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (t) => [index('cfdi_globals_period_idx').on(t.period, t.sequence)],
);
