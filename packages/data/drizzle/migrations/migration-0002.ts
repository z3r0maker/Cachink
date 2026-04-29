/**
 * Raw SQL for migration 0002 — mirrors `0002_smart_catalog.sql`.
 *
 * UXD-R3 Smart Catalog: adds tipo, seguir_stock, precio_venta_centavos,
 * atributos to products; producto_id, cantidad to sales; tipo_negocio,
 * categoria_venta_predeterminada, atributos_producto to businesses.
 */

export const migration0002Sql = `-- UXD-R3 Smart Catalog migration (ADR-043)
-- Products: new columns with safe defaults
ALTER TABLE products ADD COLUMN tipo TEXT NOT NULL DEFAULT 'producto';
--> statement-breakpoint
ALTER TABLE products ADD COLUMN seguir_stock INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE products ADD COLUMN precio_venta_centavos TEXT NOT NULL DEFAULT '0';
--> statement-breakpoint
ALTER TABLE products ADD COLUMN atributos TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
UPDATE products
  SET precio_venta_centavos = CAST(CAST(costo_unit_centavos AS INTEGER) * 13 / 10 AS TEXT)
  WHERE precio_venta_centavos = '0';
--> statement-breakpoint
ALTER TABLE sales ADD COLUMN producto_id TEXT NULL;
--> statement-breakpoint
ALTER TABLE sales ADD COLUMN cantidad INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN tipo_negocio TEXT NOT NULL DEFAULT 'mixto';
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN categoria_venta_predeterminada TEXT NOT NULL DEFAULT 'Producto';
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN atributos_producto TEXT NOT NULL DEFAULT '[]';`;
