/**
 * Raw SQL for migration 0000 — mirrors `0000_lying_johnny_blaze.sql`.
 *
 * Inlined as a TypeScript string so both Metro (mobile) and Vite
 * (desktop) bundlers can `import` the SQL without a filesystem resolver.
 * See `./index.ts` for the rationale.
 */

export const migration0000Sql = `CREATE TABLE \`businesses\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`nombre\` text NOT NULL,
\t\`regimen_fiscal\` text NOT NULL,
\t\`isr_tasa\` real NOT NULL,
\t\`logo_url\` text,
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
