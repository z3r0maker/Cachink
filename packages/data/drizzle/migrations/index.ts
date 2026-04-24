/**
 * Migrations bundle for `@cachink/data` (P1C-M2-T02 infra).
 *
 * Exposed as the `./migrations` subpath export in package.json so both
 * Metro (mobile) and Vite (desktop) can import the journal + SQL strings
 * without depending on filesystem access or a Drizzle-Kit runtime.
 *
 * Why inline the SQL instead of reading the `.sql` files at runtime:
 *   - Metro has no default `.sql` asset resolver. Shipping the SQL as a
 *     TS string sidesteps Metro config changes entirely.
 *   - Vite could import `?raw`, but splitting bundler behaviour by
 *     platform complicates testing. One TS module works everywhere.
 *
 * When Drizzle Kit emits migration 0001, add:
 *   1. A `migration0001Sql` constant with the raw SQL.
 *   2. A matching `m0001` entry in the `migrations` record.
 *   3. The `_journal.json` import is already live — Drizzle Kit updates
 *      that file automatically.
 *
 * Apps call `runMigrations(db)` from `@cachink/ui/database` once at
 * first launch.
 */

import journal from './meta/_journal.json';

/** Raw SQL for migration 0000 — mirrors 0000_lying_johnny_blaze.sql. */
const migration0000Sql = `CREATE TABLE \`businesses\` (
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

/**
 * Map of migration tag → raw SQL. Keys match `_journal.json` entry tags.
 * Used by `runMigrations()` to execute missing migrations in order.
 */
export const migrationSqlByTag: Readonly<Record<string, string>> = Object.freeze({
  '0000_lying_johnny_blaze': migration0000Sql,
});

/**
 * Drizzle-style migrations bundle.
 *
 * Shape matches what `drizzle-orm/*-sqlite/migrator`'s `migrate()` accepts,
 * so we can adopt the first-party migrator later without changing callers.
 * For Phase 1C we apply migrations via our own `runMigrations` helper
 * (see `@cachink/ui/database`) so the same code path works on Metro, Vite,
 * and `better-sqlite3` (tests).
 */
export const migrationsBundle = Object.freeze({
  journal,
  migrations: Object.freeze({ m0000: migration0000Sql }),
});

export { journal };
export default migrationsBundle;
