import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  jsonb,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';
import { projects } from './projects.js';

/**
 * MEXIA's management ledger (E-02, ADR-124 §4). A founder captures a
 * movement; the domain posts its balanced lines (`@xangarro/domain/corp`).
 *
 * Immutable by grant: the console may INSERT and SELECT, never UPDATE or
 * DELETE (0003_ledger_guards.sql). A correction is a reversal entry pointing at
 * the one it undoes. Two triggers hold what the grants cannot: an entry's
 * lines balance at commit, and nothing is dated in a closed month.
 */
export const entries = corp.table(
  'entries',
  {
    id: text('id').primaryKey(),
    /** Null for a cost shared by every project (ADR-124 §3). */
    projectId: text('project_id').references(() => projects.id),
    /** The day the money moved, `YYYY-MM-DD`. */
    fecha: date('fecha', { mode: 'string' }).notNull(),
    /** The movement kind of `@xangarro/domain/corp` (`gasto`, `cobro`, …). */
    kind: text('kind').notNull(),
    concepto: text('concepto').notNull(),
    /** Supplier, customer or partner as written by the founder. */
    contraparte: text('contraparte'),
    moneda: text('moneda', { enum: ['MXN', 'USD'] })
      .notNull()
      .default('MXN'),
    /** USD centavos when `moneda` is USD; the lines are always MXN. */
    montoOriginal: bigint('monto_original', { mode: 'bigint' }),
    /** Pesos per dollar as captured, e.g. "18.4217" (never a float). */
    tipoCambio: text('tipo_cambio'),
    deducible: boolean('deducible'),
    /** Where it came from; with `sourceRef`, makes an import idempotent. */
    source: text('source', {
      enum: ['manual', 'billing', 'statement', 'recurring', 'agent'],
    }).notNull(),
    sourceRef: text('source_ref'),
    /** The entry this one reverses, for a correction. */
    reversesEntryId: text('reverses_entry_id').unique(),
    /** The movement as captured, for the audit trail and the detail drawer. */
    payload: jsonb('payload').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
  },
  (t) => [
    unique('entries_source_ref_unique').on(t.source, t.sourceRef),
    index('entries_fecha_idx').on(t.fecha),
    check(
      'entries_usd_check',
      sql`(${t.moneda} = 'MXN' AND ${t.montoOriginal} IS NULL AND ${t.tipoCambio} IS NULL)
          OR (${t.moneda} = 'USD' AND ${t.montoOriginal} > 0 AND ${t.tipoCambio} IS NOT NULL)`,
    ),
  ],
);

export const entryLines = corp.table(
  'entry_lines',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id),
    cuenta: text('cuenta').notNull(),
    /** Cargo, MXN centavos. */
    debe: bigint('debe', { mode: 'bigint' }).notNull(),
    /** Abono, MXN centavos. */
    haber: bigint('haber', { mode: 'bigint' }).notNull(),
    socio: smallint('socio'),
  },
  (t) => [
    index('entry_lines_entry_idx').on(t.entryId),
    index('entry_lines_cuenta_idx').on(t.cuenta),
    check(
      'entry_lines_amounts_check',
      sql`${t.debe} >= 0 AND ${t.haber} >= 0 AND (${t.debe} > 0 OR ${t.haber} > 0)`,
    ),
    check('entry_lines_socio_check', sql`${t.socio} IS NULL OR ${t.socio} IN (1, 2)`),
  ],
);

/** A month closed by both founders (E-14). The ledger takes nothing dated in one. */
export const closedPeriods = corp.table('closed_periods', {
  period: text('period').primaryKey(),
  closedBy: text('closed_by').notNull(),
  closedAt: at('closed_at').notNull(),
});

/** A monthly service the founders capture each month (Vercel, el contador, …). */
export const recurringTemplates = corp.table('recurring_templates', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  nombre: text('nombre').notNull(),
  categoria: text('categoria').notNull(),
  moneda: text('moneda', { enum: ['MXN', 'USD'] })
    .notNull()
    .default('MXN'),
  /** The usual monthly amount, in the template's currency's centavos. */
  montoEstimado: bigint('monto_estimado', { mode: 'bigint' }).notNull(),
  diaCargo: smallint('dia_cargo').notNull(),
  activo: boolean('activo').notNull().default(true),
  createdAt: at('created_at').notNull(),
});
