/**
 * Businesses — root tenant row. One per business; every other row carries
 * `business_id` as a foreign key (enforced at the app layer, not SQLite).
 *
 * UXD-R3 additions (ADR-043):
 *   - `tipo_negocio` — business archetype driving UI adaptation.
 *   - `categoria_venta_predeterminada` — default SaleCategory for quick-sell.
 *   - `atributos_producto` — JSON string of AttrDef[] for custom product attributes.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  regimenFiscal: text('regimen_fiscal').notNull(),
  /** SAT régimen code; `regimenFiscal` is derived from it (migration 0002). */
  regimenSat: text('regimen_sat'),
  /** Fiscal data for CFDI (P-08, migration 0001). Filled in from the portal. */
  rfc: text('rfc'),
  razonSocial: text('razon_social'),
  codigoPostal: text('codigo_postal'),
  usoCfdi: text('uso_cfdi'),
  isrTasa: integer('isr_tasa').notNull(),
  logoUrl: text('logo_url'),
  /**
   * Branding and receipts (C-15, migration 0012). Same columns and defaults as
   * the wire and Postgres, so a pull writes what the portal set. The template
   * enum is enforced at the schema boundary, not by a SQLite CHECK.
   */
  brandColor: text('brand_color'),
  receiptTemplate: text('receipt_template', {
    enum: ['clasico', 'moderno', 'ticket', 'minimal'],
  })
    .notNull()
    .default('clasico'),
  receiptLeyenda: text('receipt_leyenda'),
  addressPrint: integer('address_print', { mode: 'boolean' }).notNull().default(false),
  whatsapp: text('whatsapp'),
  direccion: text('direccion'),
  socialLinks: text('social_links').notNull().default('{}'),
  tipoNegocio: text('tipo_negocio', {
    enum: ['producto-con-stock', 'producto-sin-stock', 'servicio', 'mixto'],
  })
    .notNull()
    .default('mixto'),
  categoriaVentaPredeterminada: text('categoria_venta_predeterminada', {
    enum: ['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro'],
  })
    .notNull()
    .default('Producto'),
  atributosProducto: text('atributos_producto').notNull().default('[]'),
  enabledPaymentMethods: text('enabled_payment_methods')
    .notNull()
    .default('["Efectivo","Transferencia","Tarjeta","QR/CoDi"]'),
  featureFlags: text('feature_flags')
    .notNull()
    .default(
      '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}',
    ),
  ...auditColumns,
});
