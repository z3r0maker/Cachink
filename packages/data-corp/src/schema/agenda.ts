import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  text,
  unique,
} from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';
import { entries } from './ledger.js';

/**
 * The Agenda and its evidence (E-04, E-05's storage; ADR-126). Files live
 * here as bytea, not in a storage bucket, so `pg_dump -n corp` still carries
 * every acuse when the area moves to its own database (ADR-124 §2).
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/** MEXIA itself: one row. E-06 adds its registries. */
export const company = corp.table('company', {
  id: text('id').primaryKey(),
  /** The SAT registration date: monthly obligations start in its month. */
  inscripcionRfc: date('inscripcion_rfc', { mode: 'string' }),
  updatedBy: text('updated_by').notNull(),
  updatedAt: at('updated_at').notNull(),
});

/**
 * One period of an obligation of `@xangarro/domain/corp`'s catalog. A
 * recurring period gets a row the first time a founder acts on it; a one-off
 * (an expiry, a share event) is created with its date as `period`.
 */
export const obligations = corp.table(
  'obligations',
  {
    id: text('id').primaryKey(),
    templateId: text('template_id').notNull(),
    period: text('period').notNull(),
    title: text('title'),
    status: text('status', { enum: ['pendiente', 'preparada', 'presentada', 'pagada'] })
      .notNull()
      .default('pendiente'),
    noPayment: boolean('no_payment').notNull().default(false),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
    updatedBy: text('updated_by').notNull(),
    updatedAt: at('updated_at').notNull(),
  },
  (t) => [
    unique('obligations_template_period_unique').on(t.templateId, t.period),
    check(
      'obligations_status_check',
      sql`${t.status} IN ('pendiente', 'preparada', 'presentada', 'pagada')`,
    ),
  ],
);

/**
 * A kept file (E-05). Never updated or deleted by the console: a new
 * version names the one it supersedes. Kept at least five years (CFF 30).
 */
export const documents = corp.table(
  'documents',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    filename: text('filename').notNull(),
    mime: text('mime').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    /** Hex SHA-256 of `content`. */
    sha256: text('sha256').notNull(),
    content: bytea('content').notNull(),
    obligationId: text('obligation_id').references(() => obligations.id),
    entryId: text('entry_id').references(() => entries.id),
    retainUntil: date('retain_until', { mode: 'string' }).notNull(),
    supersedesId: text('supersedes_id')
      .unique()
      .references((): AnyPgColumn => documents.id),
    uploadedBy: text('uploaded_by').notNull(),
    uploadedAt: at('uploaded_at').notNull(),
  },
  (t) => [
    index('documents_obligation_idx').on(t.obligationId),
    check(
      'documents_size_check',
      sql`${t.sizeBytes} > 0 AND ${t.sizeBytes} <= 4194304 AND octet_length(${t.content}) = ${t.sizeBytes}`,
    ),
    check('documents_sha256_check', sql`${t.sha256} ~ '^[0-9a-f]{64}$'`),
  ],
);
