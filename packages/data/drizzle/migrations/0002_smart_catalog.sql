-- UXD-R3 Smart Catalog migration (ADR-043)
-- Adds tipo, seguir_stock, precio_venta_centavos, atributos to products;
-- producto_id, cantidad to sales; tipo_negocio, categoria_venta_predeterminada,
-- atributos_producto to businesses.

-- Products: new columns with safe defaults
ALTER TABLE products ADD COLUMN tipo TEXT NOT NULL DEFAULT 'producto';
ALTER TABLE products ADD COLUMN seguir_stock INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN precio_venta_centavos TEXT NOT NULL DEFAULT '0';
ALTER TABLE products ADD COLUMN atributos TEXT NOT NULL DEFAULT '{}';

-- Backfill precio_venta_centavos from costo_unit_centavos × 1.3 (30% markup)
-- for existing products that still have the default 0 value.
UPDATE products
  SET precio_venta_centavos = CAST(CAST(costo_unit_centavos AS INTEGER) * 13 / 10 AS TEXT)
  WHERE precio_venta_centavos = '0';

-- Sales: new columns
ALTER TABLE sales ADD COLUMN producto_id TEXT NULL;
ALTER TABLE sales ADD COLUMN cantidad INTEGER NOT NULL DEFAULT 1;

-- Businesses: new columns
ALTER TABLE businesses ADD COLUMN tipo_negocio TEXT NOT NULL DEFAULT 'mixto';
ALTER TABLE businesses ADD COLUMN categoria_venta_predeterminada TEXT NOT NULL DEFAULT 'Producto';
ALTER TABLE businesses ADD COLUMN atributos_producto TEXT NOT NULL DEFAULT '[]';
