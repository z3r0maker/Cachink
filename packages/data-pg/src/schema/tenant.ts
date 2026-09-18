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

import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { auditColumns, centavos } from './_columns';

export const businesses = pgTable('businesses', {
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

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono'),
  email: text('email'),
  nota: text('nota'),
  ...auditColumns,
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  puesto: text('puesto').notNull(),
  salarioCentavos: centavos('salario_centavos').notNull(),
  periodo: text('periodo', { enum: ['semanal', 'quincenal', 'mensual'] }).notNull(),
  ...auditColumns,
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email'),
  pinHash: text('pin_hash').notNull(),
  recoveryPasswordHash: text('recovery_password_hash').notNull(),
  role: text('role', { enum: ['operativo', 'director'] }).notNull(),
  mustChangePin: boolean('must_change_pin').notNull().default(false),
  avatarColor: text('avatar_color').notNull().default('blue'),
  permissions: text('permissions').notNull().default('{}'),
  /**
   * Portal-managed deactivation (F-07, B-13). Inactive operators cannot
   * authenticate. The domain `User` and the wire contract already carry it;
   * the device column arrives with A-17, which is why `drift.test.ts` lists it
   * as the one cloud-ahead column — see `CLOUD_AHEAD` there.
   */
  active: boolean('active').notNull().default(true),
  ...auditColumns,
});
