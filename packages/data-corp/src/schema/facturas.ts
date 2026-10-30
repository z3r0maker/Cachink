import { sql } from 'drizzle-orm';
import { bigint, check, date, index, text } from 'drizzle-orm/pg-core';

import { at, bytea, corp } from './corp.js';
import { entries } from './ledger.js';
import { projects } from './projects.js';

/**
 * Received invoices (E-11, boards CD-06b and CD-06c). Each row is one CFDI by
 * its UUID: what its XML says never changes, only where it stands. It waits
 * «por_revisar» until registered, which posts its expense (`entry_id`); an
 * invoice on credit is later paid (`pago_entry_id`) or cancelled. A cancelled
 * CFDI is kept, flagged, and posts nothing.
 *
 * The console never deletes one (0006_zz_corp_facturas_guards.sql): leaving
 * the review marks it «descartada», and a new upload takes it again.
 *
 * Amounts are MXN centavos; a USD invoice keeps its dollar total and rate.
 */
export const receivedInvoices = corp.table(
  'received_invoices',
  {
    /** The folio fiscal, upper case. */
    uuid: text('uuid').primaryKey(),
    /** Issue date. */
    fecha: date('fecha', { mode: 'string' }).notNull(),
    folio: text('folio'),
    emisorRfc: text('emisor_rfc').notNull(),
    emisorNombre: text('emisor_nombre').notNull(),
    receptorRfc: text('receptor_rfc').notNull(),
    usoCfdi: text('uso_cfdi').notNull(),
    metodoPago: text('metodo_pago', { enum: ['PUE', 'PPD'] }).notNull(),
    moneda: text('moneda', { enum: ['MXN', 'USD'] }).notNull(),
    /** USD centavos of the total, for a USD invoice. */
    montoOriginal: bigint('monto_original', { mode: 'bigint' }),
    tipoCambio: text('tipo_cambio'),
    /** The cost before IVA: subtotal less discount, plus taxes other than IVA. */
    subtotal: bigint('subtotal', { mode: 'bigint' }).notNull(),
    iva: bigint('iva', { mode: 'bigint' }).notNull(),
    retencionIsr: bigint('retencion_isr', { mode: 'bigint' }).notNull(),
    retencionIva: bigint('retencion_iva', { mode: 'bigint' }).notNull(),
    total: bigint('total', { mode: 'bigint' }).notNull(),
    concepto: text('concepto').notNull(),
    /** The total as the XML writes it and the seal's last 8 characters, for the SAT's query. */
    satTotal: text('sat_total').notNull(),
    sello8: text('sello8').notNull(),
    archivo: text('archivo').notNull(),
    /** The file exactly as uploaded. */
    xml: bytea('xml').notNull(),
    estado: text('estado', {
      enum: ['por_revisar', 'registrada', 'cancelada', 'descartada'],
    }).notNull(),
    /** What the SAT said at upload; «sin_verificar» when it did not answer. */
    estadoSat: text('estado_sat', { enum: ['vigente', 'cancelado', 'sin_verificar'] }).notNull(),
    /** A `CategoriaGasto` of `@xangarro/domain/corp`, chosen at registration. */
    categoria: text('categoria'),
    projectId: text('project_id').references(() => projects.id),
    entryId: text('entry_id')
      .unique()
      .references(() => entries.id),
    pagoEntryId: text('pago_entry_id')
      .unique()
      .references(() => entries.id),
    createdBy: text('created_by').notNull(),
    createdAt: at('created_at').notNull(),
    updatedAt: at('updated_at').notNull(),
  },
  (t) => [
    index('received_invoices_fecha_idx').on(t.fecha),
    index('received_invoices_emisor_idx').on(t.emisorRfc),
    check(
      'received_invoices_uuid_check',
      sql`${t.uuid} ~ '^[0-9A-F]{8}(-[0-9A-F]{4}){3}-[0-9A-F]{12}$'`,
    ),
    check(
      'received_invoices_estado_check',
      sql`${t.estado} IN ('por_revisar', 'registrada', 'cancelada', 'descartada')`,
    ),
    check(
      'received_invoices_estado_sat_check',
      sql`${t.estadoSat} IN ('vigente', 'cancelado', 'sin_verificar')`,
    ),
    check('received_invoices_metodo_check', sql`${t.metodoPago} IN ('PUE', 'PPD')`),
    check(
      'received_invoices_montos_check',
      sql`${t.subtotal} > 0 AND ${t.iva} >= 0 AND ${t.retencionIsr} >= 0 AND ${t.retencionIva} >= 0
          AND ${t.total} = ${t.subtotal} + ${t.iva} - ${t.retencionIsr} - ${t.retencionIva}`,
    ),
    check(
      'received_invoices_usd_check',
      sql`(${t.moneda} = 'MXN' AND ${t.montoOriginal} IS NULL AND ${t.tipoCambio} IS NULL)
          OR (${t.moneda} = 'USD' AND ${t.montoOriginal} > 0 AND ${t.tipoCambio} IS NOT NULL)`,
    ),
    check(
      'received_invoices_categoria_check',
      sql`${t.categoria} IS NULL OR ${t.categoria} IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')`,
    ),
    // Registered means posted: its expense and its category are there.
    check(
      'received_invoices_registrada_check',
      sql`${t.estado} <> 'registrada' OR (${t.entryId} IS NOT NULL AND ${t.categoria} IS NOT NULL)`,
    ),
    check(
      'received_invoices_pago_check',
      sql`${t.pagoEntryId} IS NULL OR (${t.metodoPago} = 'PPD' AND ${t.entryId} IS NOT NULL)`,
    ),
  ],
);
