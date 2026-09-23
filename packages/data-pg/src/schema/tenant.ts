/**
 * Cloud schema — tenant tables.
 *
 * Bootstrapped from the device's SQLite schema so that **column names are
 * identical on both sides by construction**, then maintained by hand.
 * `tests/drift.test.ts` is what keeps them that way: the sync wire format
 * addresses columns by name, so a silent rename would corrupt rows rather than
 * fail loudly.
 *
 * Types differ where Postgres has better ones — `timestamptz` for the audit
 * stamps, `bigint` for centavos — but never the names.
 */

import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { auditColumns, centavos } from './_columns';

export const businesses = pgTable(
  'businesses',
  {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    regimenFiscal: text('regimen_fiscal').notNull(),
    /** SAT régimen code — the régimen; `regimenFiscal` is derived from it (0013). */
    regimenSat: text('regimen_sat'),
    /** Fiscal data for CFDI (P-08, README Q15). Nullable until the owner fills it in. */
    rfc: text('rfc'),
    razonSocial: text('razon_social'),
    codigoPostal: text('codigo_postal'),
    /** c_UsoCFDI; null → the CFDI router's default, G03. */
    usoCfdi: text('uso_cfdi'),
    isrTasa: integer('isr_tasa').notNull(),
    logoUrl: text('logo_url'),
    /** Branding and receipts (C-15, N-19/N-20; migration 0023). */
    brandColor: text('brand_color'),
    receiptTemplate: text('receipt_template', {
      enum: ['clasico', 'moderno', 'ticket', 'minimal'],
    })
      .notNull()
      .default('clasico'),
    receiptLeyenda: text('receipt_leyenda'),
    addressPrint: boolean('address_print').notNull().default(false),
    whatsapp: text('whatsapp'),
    /** What `address_print` prints (C-15; migration 0028). */
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
  },
  (t) => [index('businesses_business_idx').on(t.businessId)],
);

export const clients = pgTable(
  'clients',
  {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    telefono: text('telefono'),
    email: text('email'),
    nota: text('nota'),
    /** Optional, set by the Clientes import (N-16); migration 0020. */
    rfc: text('rfc'),
    /** Owner-set credit line and term (ADR-074, C-18). */
    limiteCentavos: centavos('limite_centavos'),
    plazoDias: integer('plazo_dias'),
    /** «Creado en caja» review (ADR-074); portal-written rows are `aprobado`. */
    estadoRevision: text('estado_revision', {
      enum: ['pendiente', 'aprobado', 'fusionado', 'rechazado'],
    })
      .notNull()
      .default('aprobado'),
    fusionadoConId: text('fusionado_con_id'),
    ...auditColumns,
  },
  (t) => [index('clients_business_idx').on(t.businessId, t.nombre)],
);

export const employees = pgTable(
  'employees',
  {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    puesto: text('puesto').notNull(),
    salarioCentavos: centavos('salario_centavos').notNull(),
    periodo: text('periodo', { enum: ['semanal', 'quincenal', 'mensual'] }).notNull(),
    ...auditColumns,
  },
  (t) => [index('employees_business_idx').on(t.businessId)],
);

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    nombre: text('nombre').notNull(),
    pinHash: text('pin_hash').notNull(),
    avatarColor: text('avatar_color').notNull().default('blue'),
    /** Portal-granted permissions JSON (merge, A-05). */
    permissions: text('permissions').notNull().default('{}'),
    /** Portal-managed deactivation. Inactive operators cannot authenticate. */
    active: boolean('active').notNull().default(true),
    ...auditColumns,
  },
  (t) => [index('users_business_idx').on(t.businessId)],
);
