import { sql } from 'drizzle-orm';
import { bigint, check, index, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * Cierre del mes (E-14, boards CD-10 and CD-10b). The lock itself stays in
 * `corp.closed_periods`; this is its history: each close, each request to
 * reopen with its reason, and each answer. Append-only, and two triggers
 * (0013_zz) hold the two-founder rule: «reabierto» needs a pending request by
 * the other founder, and a lock is lifted only right after one.
 */
export const periodEvents = corp.table(
  'period_events',
  {
    /** Insertion order; the triggers and the screen read the events by it. */
    seq: bigint('seq', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    /** `YYYY-MM`. */
    period: text('period').notNull(),
    kind: text('kind', {
      enum: ['cerrado', 'reapertura_pedida', 'reapertura_rechazada', 'reabierto'],
    }).notNull(),
    /** `corp.founders.id` of who did it. */
    founderId: text('founder_id').notNull(),
    /** Why reopen; only a request carries one. */
    motivo: text('motivo'),
    at: at('at').notNull(),
  },
  (t) => [
    index('period_events_period_idx').on(t.period, t.seq),
    check('period_events_period_check', sql`${t.period} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
    check(
      'period_events_kind_check',
      sql`${t.kind} IN ('cerrado', 'reapertura_pedida', 'reapertura_rechazada', 'reabierto')`,
    ),
    check(
      'period_events_motivo_check',
      sql`(${t.kind} = 'reapertura_pedida') = (${t.motivo} IS NOT NULL AND length(trim(${t.motivo})) > 0)`,
    ),
  ],
);

/**
 * The bank statement's balance at a month's last day, confirmed by a founder
 * when it equals Bancos in the ledger (step 4 of the close). Confirmed again
 * after a reopening, so an UPDATE.
 */
export const bankBalances = corp.table(
  'bank_balances',
  {
    period: text('period').primaryKey(),
    /** Centavos. */
    saldo: bigint('saldo', { mode: 'bigint' }).notNull(),
    confirmedBy: text('confirmed_by').notNull(),
    confirmedAt: at('confirmed_at').notNull(),
  },
  (t) => [check('bank_balances_period_check', sql`${t.period} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`)],
);
