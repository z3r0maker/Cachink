/**
 * Raw SQL for migration 0000 — the initial schema.
 *
 * Inlined as a TypeScript string so both Metro (mobile) and Vite
 * (desktop) bundlers can `import` the SQL without a filesystem resolver.
 * See `./index.ts` for the rationale.
 *
 * This migration includes the full schema as of Phase 1 + UXD-R3 +
 * ADR-048 (smart catalog columns on products/sales/businesses, and
 * productoId NOT NULL on sales). Since the app hasn't shipped publicly,
 * we fold all schema changes into the initial migration rather than
 * maintaining a chain of ALTER TABLE migrations.
 */

export const migration0000Sql = `CREATE TABLE \`businesses\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`nombre\` text NOT NULL,
\t\`regimen_fiscal\` text NOT NULL,
\t\`isr_tasa\` real NOT NULL,
\t\`logo_url\` text,
\t\`tipo_negocio\` text NOT NULL DEFAULT 'mixto',
\t\`categoria_venta_predeterminada\` text NOT NULL DEFAULT 'Producto',
\t\`atributos_producto\` text NOT NULL DEFAULT '[]',
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`app_config\` (
\t\`key\` text PRIMARY KEY NOT NULL,
\t\`value\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`sales\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`concepto\` text NOT NULL,
\t\`categoria\` text NOT NULL,
\t\`monto_centavos\` numeric NOT NULL,
\t\`metodo\` text NOT NULL,
\t\`cliente_id\` text,
\t\`estado_pago\` text NOT NULL,
\t\`producto_id\` text NOT NULL,
\t\`cantidad\` integer NOT NULL DEFAULT 1,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`expenses\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`concepto\` text NOT NULL,
\t\`categoria\` text NOT NULL,
\t\`monto_centavos\` numeric NOT NULL,
\t\`proveedor\` text,
\t\`gasto_recurrente_id\` text,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`products\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`nombre\` text NOT NULL,
\t\`sku\` text,
\t\`categoria\` text NOT NULL,
\t\`costo_unit_centavos\` numeric NOT NULL,
\t\`unidad\` text NOT NULL,
\t\`umbral_stock_bajo\` integer DEFAULT 3 NOT NULL,
\t\`tipo\` text NOT NULL DEFAULT 'producto',
\t\`seguir_stock\` integer NOT NULL DEFAULT 1,
\t\`precio_venta_centavos\` text NOT NULL DEFAULT '0',
\t\`atributos\` text NOT NULL DEFAULT '{}',
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`inventory_movements\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`producto_id\` text NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`tipo\` text NOT NULL,
\t\`cantidad\` integer NOT NULL,
\t\`costo_unit_centavos\` numeric NOT NULL,
\t\`motivo\` text NOT NULL,
\t\`nota\` text,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`employees\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`nombre\` text NOT NULL,
\t\`puesto\` text NOT NULL,
\t\`salario_centavos\` numeric NOT NULL,
\t\`periodo\` text NOT NULL,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`clients\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`nombre\` text NOT NULL,
\t\`telefono\` text,
\t\`email\` text,
\t\`nota\` text,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`client_payments\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`venta_id\` text NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`monto_centavos\` numeric NOT NULL,
\t\`metodo\` text NOT NULL,
\t\`nota\` text,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`day_closes\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`efectivo_esperado_centavos\` numeric NOT NULL,
\t\`efectivo_contado_centavos\` numeric NOT NULL,
\t\`diferencia_centavos\` numeric NOT NULL,
\t\`explicacion\` text,
\t\`cerrado_por\` text NOT NULL,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`recurring_expenses\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`concepto\` text NOT NULL,
\t\`categoria\` text NOT NULL,
\t\`monto_centavos\` numeric NOT NULL,
\t\`proveedor\` text,
\t\`frecuencia\` text NOT NULL,
\t\`dia_del_mes\` integer,
\t\`dia_de_la_semana\` integer,
\t\`proximo_disparo\` text NOT NULL,
\t\`activo\` integer DEFAULT true NOT NULL,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);`;
