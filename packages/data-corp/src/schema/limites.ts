import { sql } from 'drizzle-orm';
import { bigint, check, smallint, text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * The year's income caps (E-15, board CD-12d): the SAS's (LGSM art. 260,
 * updated by the DOF each December) and RESICO persona moral's (LISR
 * art. 206). One row per year, so a year without its own row is never
 * measured against last year's. A founder captures them; a correction is an
 * UPDATE, audited by the console.
 */
export const annualCaps = corp.table(
  'annual_caps',
  {
    anio: smallint('anio').primaryKey(),
    /** Centavos. */
    topeSas: bigint('tope_sas', { mode: 'bigint' }).notNull(),
    topeResico: bigint('tope_resico', { mode: 'bigint' }).notNull(),
    updatedBy: text('updated_by').notNull(),
    updatedAt: at('updated_at').notNull(),
  },
  (t) => [
    check('annual_caps_anio_check', sql`${t.anio} BETWEEN 2000 AND 2100`),
    check('annual_caps_topes_check', sql`${t.topeSas} > 0 AND ${t.topeResico} > 0`),
  ],
);
