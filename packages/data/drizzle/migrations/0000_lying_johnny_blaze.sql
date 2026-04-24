CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`regimen_fiscal` text NOT NULL,
	`isr_tasa` real NOT NULL,
	`logo_url` text,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `app_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`fecha` text NOT NULL,
	`concepto` text NOT NULL,
	`categoria` text NOT NULL,
	`monto_centavos` numeric NOT NULL,
	`metodo` text NOT NULL,
	`cliente_id` text,
	`estado_pago` text NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`fecha` text NOT NULL,
	`concepto` text NOT NULL,
	`categoria` text NOT NULL,
	`monto_centavos` numeric NOT NULL,
	`proveedor` text,
	`gasto_recurrente_id` text,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`sku` text,
	`categoria` text NOT NULL,
	`costo_unit_centavos` numeric NOT NULL,
	`unidad` text NOT NULL,
	`umbral_stock_bajo` integer DEFAULT 3 NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`fecha` text NOT NULL,
	`tipo` text NOT NULL,
	`cantidad` integer NOT NULL,
	`costo_unit_centavos` numeric NOT NULL,
	`motivo` text NOT NULL,
	`nota` text,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`puesto` text NOT NULL,
	`salario_centavos` numeric NOT NULL,
	`periodo` text NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`telefono` text,
	`email` text,
	`nota` text,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `client_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`venta_id` text NOT NULL,
	`fecha` text NOT NULL,
	`monto_centavos` numeric NOT NULL,
	`metodo` text NOT NULL,
	`nota` text,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `day_closes` (
	`id` text PRIMARY KEY NOT NULL,
	`fecha` text NOT NULL,
	`efectivo_esperado_centavos` numeric NOT NULL,
	`efectivo_contado_centavos` numeric NOT NULL,
	`diferencia_centavos` numeric NOT NULL,
	`explicacion` text,
	`cerrado_por` text NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `recurring_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`concepto` text NOT NULL,
	`categoria` text NOT NULL,
	`monto_centavos` numeric NOT NULL,
	`proveedor` text,
	`frecuencia` text NOT NULL,
	`dia_del_mes` integer,
	`dia_de_la_semana` integer,
	`proximo_disparo` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
