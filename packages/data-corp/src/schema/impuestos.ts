import { sql } from 'drizzle-orm';
import { bigint, check, date, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * What the contador declared for a month (E-13, board CD-09b, ADR-148): the
 * ISR provisional, the IVA and both withholdings, and the línea de captura.
 * Its papers are the evidence of the Agenda's «ISR e IVA» of the same period;
 * its payment is the ledger entry with `source_ref = 'impuestos:<period>'`.
 * A correction before the payment is an UPDATE, audited by the console.
 */
export const taxReturns = corp.table(
  'tax_returns',
  {
    /** `YYYY-MM`. */
    period: text('period').primaryKey(),
    /** Centavos. */
    isr: bigint('isr', { mode: 'bigint' }).notNull(),
    iva: bigint('iva', { mode: 'bigint' }).notNull(),
    retencionIsr: bigint('retencion_isr', { mode: 'bigint' }).notNull(),
    retencionIva: bigint('retencion_iva', { mode: 'bigint' }).notNull(),
    lineaImporte: bigint('linea_importe', { mode: 'bigint' }),
    lineaVigencia: date('linea_vigencia', { mode: 'string' }),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
    updatedBy: text('updated_by').notNull(),
    updatedAt: at('updated_at').notNull(),
  },
  (t) => [
    check('tax_returns_period_check', sql`${t.period} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
    check(
      'tax_returns_amounts_check',
      sql`${t.isr} >= 0 AND ${t.iva} >= 0 AND ${t.retencionIsr} >= 0 AND ${t.retencionIva} >= 0`,
    ),
    check('tax_returns_linea_check', sql`${t.lineaImporte} IS NULL OR ${t.lineaImporte} > 0`),
  ],
);
