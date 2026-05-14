/**
 * Migration 0010 — Conversión de Materia Prima.
 *
 * Phase 8: adds uso_producto to products, creates conversion tables.
 */

export const migration0010Sql = `ALTER TABLE products ADD COLUMN uso_producto TEXT NOT NULL DEFAULT 'venta';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`conversion_recetas\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`materia_prima_id\` text NOT NULL,
\t\`producto_resultante_id\` text NOT NULL,
\t\`cantidad_origen\` integer NOT NULL,
\t\`cantidad_resultante\` integer NOT NULL,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_by_user_id\` text,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`conversions\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`receta_id\` text NOT NULL,
\t\`materia_prima_id\` text NOT NULL,
\t\`producto_resultante_id\` text NOT NULL,
\t\`cantidad_origen_usada\` integer NOT NULL,
\t\`cantidad_resultante_creada\` integer NOT NULL,
\t\`movimiento_salida_id\` text NOT NULL,
\t\`movimiento_entrada_id\` text NOT NULL,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_by_user_id\` text,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);`;
