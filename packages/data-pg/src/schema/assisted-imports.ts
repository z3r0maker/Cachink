import { customType, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { auditColumns } from './_columns';

/**
 * «Hazlo por mí» (N-18, migration 0026): the assisted-import state machine.
 * Portal-only — never synced. The commit invariant lives in the guarded
 * status transitions (`esperando_aprobacion` → `aplicada` by the tenant
 * only); file bytes are private (tenant + staff), purged 30 days after
 * resolution by the digest cron.
 */

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const assistedImports = pgTable(
  'assisted_imports',
  {
    id: text('id').primaryKey(),
    status: text('status', {
      enum: ['revision', 'esperando_aprobacion', 'aplicada', 'rechazada', 'expirada'],
    })
      .notNull()
      .default('revision'),
    sistemaActual: text('sistema_actual').notNull(),
    notas: text('notas').notNull().default(''),
    plantilla: text('plantilla', { enum: ['productos', 'clientes'] }),
    requestedBy: text('requested_by'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
    filesPurgedAt: timestamp('files_purged_at', { withTimezone: true, mode: 'string' }),
    ...auditColumns,
  },
  (t) => [index('assisted_imports_business_idx').on(t.businessId)],
);

export const assistedImportFiles = pgTable(
  'assisted_import_files',
  {
    id: text('id').primaryKey(),
    assistedImportId: text('assisted_import_id').notNull(),
    businessId: text('business_id').notNull(),
    role: text('role', { enum: ['solicitud', 'mapeado'] })
      .notNull()
      .default('solicitud'),
    filename: text('filename').notNull(),
    mime: text('mime').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    bytes: bytea('bytes').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true, mode: 'string' }).notNull(),
  },
  (t) => [index('assisted_import_files_import_idx').on(t.assistedImportId)],
);

export type AssistedImportStatus =
  | 'revision'
  | 'esperando_aprobacion'
  | 'aplicada'
  | 'rechazada'
  | 'expirada';

export type AssistedImportFileRole = 'solicitud' | 'mapeado';
