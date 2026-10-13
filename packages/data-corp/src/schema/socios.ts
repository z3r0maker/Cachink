import { sql } from 'drizzle-orm';
import { bigint, check, date, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * A call for equal funding (E-03, agreement Quinta). Each partner's half is a
 * ledger entry with `source_ref = llamada:<id>:F<n>`, so a half is paid once
 * and the call's state is read from the ledger, never stored twice.
 */
export const fundingCalls = corp.table(
  'funding_calls',
  {
    id: text('id').primaryKey(),
    concepto: text('concepto').notNull(),
    /** MXN centavos. */
    total: bigint('total', { mode: 'bigint' }).notNull(),
    /** MXN centavos each partner pays: half the total, an odd centavo rounded up. */
    porSocio: bigint('por_socio', { mode: 'bigint' }).notNull(),
    vence: date('vence', { mode: 'string' }).notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
  },
  (t) => [
    check(
      'funding_calls_amounts_check',
      sql`${t.total} > 0 AND ${t.porSocio} * 2 >= ${t.total} AND ${t.porSocio} * 2 <= ${t.total} + 1`,
    ),
  ],
);
