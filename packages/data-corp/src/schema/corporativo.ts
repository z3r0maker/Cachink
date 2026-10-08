import { sql } from 'drizzle-orm';
import { boolean, check, date, integer, smallint, text } from 'drizzle-orm/pg-core';

import { documents } from './agenda.js';
import { at, corp } from './corp.js';

/**
 * The corporate book (E-06): the share register, the registries and
 * paperwork MEXIA keeps alive, and its certificates' serials and expiries.
 * Certificates are metadata only: no key, no .cer, no password, ever.
 */
export const shareEvents = corp.table(
  'share_events',
  {
    id: text('id').primaryKey(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    kind: text('kind', { enum: ['suscripcion', 'transmision'] }).notNull(),
    fromSocio: smallint('from_socio'),
    toSocio: smallint('to_socio').notNull(),
    shares: integer('shares').notNull(),
    note: text('note'),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
  },
  (t) => [
    check('share_events_kind_check', sql`${t.kind} IN ('suscripcion', 'transmision')`),
    check('share_events_shares_check', sql`${t.shares} > 0`),
    check(
      'share_events_partners_check',
      sql`${t.toSocio} IN (1, 2) AND (
        (${t.kind} = 'suscripcion' AND ${t.fromSocio} IS NULL)
        OR (${t.kind} = 'transmision' AND ${t.fromSocio} IN (1, 2) AND ${t.fromSocio} <> ${t.toSocio}))`,
    ),
  ],
);

/** RFC, SAS, trademark, bank, domains: seeded by 0004_corporativo_grants.sql. */
export const registries = corp.table('registries', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  autoridad: text('autoridad').notNull(),
  estado: text('estado').notNull(),
  referencia: text('referencia'),
  siguiente: text('siguiente').notNull(),
  alDia: boolean('al_dia').notNull().default(false),
  folder: text('folder').notNull(),
  documentId: text('document_id').references(() => documents.id),
  sortOrder: smallint('sort_order').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: at('updated_at'),
});

export const certificates = corp.table(
  'certificates',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['csd', 'efirma'] }).notNull(),
    holder: text('holder', { enum: ['mexia', 'f1', 'f2'] }).notNull(),
    /** The certificate's serial number (public data). */
    serial: text('serial').notNull(),
    expiresOn: date('expires_on', { mode: 'string' }).notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
  },
  (t) => [
    check('certificates_kind_check', sql`${t.kind} IN ('csd', 'efirma')`),
    check('certificates_holder_check', sql`${t.holder} IN ('mexia', 'f1', 'f2')`),
    // A serial, never a key: PEM armour, spaces and slashes cannot get in.
    check('certificates_serial_check', sql`${t.serial} ~ '^[0-9A-Za-z]{4,40}$'`),
  ],
);
