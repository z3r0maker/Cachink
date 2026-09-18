/**
 * `business_onboarding` — the "Platícanos de ti" answers and the "¿Cómo
 * empiezo?" checklist state (N-12 … N-15, ADR-067).
 *
 * **Portal-only** (ADR-060): absent from `scope.ts`, so it never crosses the
 * wire. It is deliberately NOT a column on `businesses`: that is a DOWN table,
 * and every write to it is logged for the phones — onboarding answers and
 * pending paid answers are nothing a device reads.
 *
 * **Keyed by `business_id`, no id of its own.** There is exactly one row per
 * business, so a surrogate ULID would be a second key for the same fact; the
 * business id is already branded (`BusinessId`) in the domain. RLS reads the
 * same `business_id` column as every other tenant table.
 *
 * The JSON columns hold domain shapes validated at the boundary:
 * `answers` is `WizardAnswers` (parsed with `WizardAnswersSchema` on every
 * read and write), `pending_paid_answers` is `PendingPaidAnswer[]`, and
 * `trial_intent` records a [Probar 14 días] tap until Checkout exists (B-10).
 */

import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const businessOnboarding = pgTable('business_onboarding', {
  businessId: text('business_id').primaryKey(),
  answers: jsonb('answers').notNull().default({}),
  /** Items the owner ticked by hand; auto-detected items are computed, not stored. */
  checklist: jsonb('checklist').notNull().default({}),
  pendingPaidAnswers: jsonb('pending_paid_answers').notNull().default([]),
  /** `{ plan, interval, at }` of the last trial request, or null. */
  trialIntent: jsonb('trial_intent'),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
});
