/**
 * Businesses — root tenant row. One per business; every other row carries
 * `business_id` as a foreign key (enforced at the app layer, not SQLite).
 *
 * UXD-R3 additions (ADR-043):
 *   - `tipo_negocio` — business archetype driving UI adaptation.
 *   - `categoria_venta_predeterminada` — default SaleCategory for quick-sell.
 *   - `atributos_producto` — JSON string of AttrDef[] for custom product attributes.
 */

import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  regimenFiscal: text('regimen_fiscal').notNull(),
  isrTasa: real('isr_tasa').notNull(),
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
  ...auditColumns,
});
