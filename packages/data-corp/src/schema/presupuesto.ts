import { sql } from 'drizzle-orm';
import { bigint, boolean, check, index, primaryKey, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * Presupuesto (E-22, boards CD-15d and CD-15e). Append-only: a budget is
 * prepared once and answered once; a spending request is asked once and,
 * unless it fit in its founder's Límite, answered once. Triggers (0014_zz)
 * hold the two-founder rule: neither the budget's nor the request's own
 * founder may approve it.
 */
const CATEGORIAS = sql.raw(
  `('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')`,
);

export const budgets = corp.table(
  'budgets',
  {
    id: text('id').primaryKey(),
    /** `YYYY-Tn`. */
    quarter: text('quarter').notNull(),
    /** `corp.founders.id` of who prepared it. */
    preparedBy: text('prepared_by').notNull(),
    preparedAt: at('prepared_at').notNull(),
  },
  (t) => [
    index('budgets_quarter_idx').on(t.quarter),
    check('budgets_quarter_check', sql`${t.quarter} ~ '^[0-9]{4}-T[1-4]$'`),
  ],
);

/** A budget's monthly amount for one category, centavos. */
export const budgetLines = corp.table(
  'budget_lines',
  {
    budgetId: text('budget_id')
      .notNull()
      .references(() => budgets.id),
    categoria: text('categoria').notNull(),
    monto: bigint('monto', { mode: 'bigint' }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.budgetId, t.categoria] }),
    check('budget_lines_categoria_check', sql`${t.categoria} IN ${CATEGORIAS}`),
    check('budget_lines_monto_check', sql`${t.monto} >= 0`),
  ],
);

export const budgetAnswers = corp.table(
  'budget_answers',
  {
    budgetId: text('budget_id')
      .primaryKey()
      .references(() => budgets.id),
    kind: text('kind', { enum: ['aprobado', 'rechazado'] }).notNull(),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [check('budget_answers_kind_check', sql`${t.kind} IN ('aprobado', 'rechazado')`)],
);

export const spendRequests = corp.table(
  'spend_requests',
  {
    id: text('id').primaryKey(),
    /** The month it was asked in, `YYYY-MM`. */
    period: text('period').notNull(),
    founderId: text('founder_id').notNull(),
    concepto: text('concepto').notNull(),
    categoria: text('categoria').notNull(),
    /** Centavos, with IVA. */
    monto: bigint('monto', { mode: 'bigint' }).notNull(),
    /** Approved on its own, inside its founder's Límite. */
    automatica: boolean('automatica').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    index('spend_requests_period_idx').on(t.period, t.founderId),
    check('spend_requests_period_check', sql`${t.period} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
    check('spend_requests_categoria_check', sql`${t.categoria} IN ${CATEGORIAS}`),
    check('spend_requests_monto_check', sql`${t.monto} > 0`),
    check('spend_requests_concepto_check', sql`length(trim(${t.concepto})) > 0`),
  ],
);

export const spendRequestAnswers = corp.table(
  'spend_request_answers',
  {
    requestId: text('request_id')
      .primaryKey()
      .references(() => spendRequests.id),
    kind: text('kind', { enum: ['aprobada', 'rechazada'] }).notNull(),
    /** What was approved, centavos; null when rejected. */
    monto: bigint('monto', { mode: 'bigint' }),
    founderId: text('founder_id').notNull(),
    at: at('at').notNull(),
  },
  (t) => [
    check('spend_request_answers_kind_check', sql`${t.kind} IN ('aprobada', 'rechazada')`),
    check(
      'spend_request_answers_monto_check',
      sql`(${t.kind} = 'aprobada') = (${t.monto} IS NOT NULL AND ${t.monto} > 0)`,
    ),
  ],
);
