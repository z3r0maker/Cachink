ALTER TABLE products ADD COLUMN uso_producto TEXT NOT NULL DEFAULT 'venta';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `conversion_recetas` (
	`id` text PRIMARY KEY NOT NULL,
	`materia_prima_id` text NOT NULL,
	`producto_resultante_id` text NOT NULL,
	`cantidad_origen` integer NOT NULL,
	`cantidad_resultante` integer NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `conversions` (
	`id` text PRIMARY KEY NOT NULL,
	`receta_id` text NOT NULL,
	`materia_prima_id` text NOT NULL,
	`producto_resultante_id` text NOT NULL,
	`cantidad_origen_usada` integer NOT NULL,
	`cantidad_resultante_creada` integer NOT NULL,
	`movimiento_salida_id` text NOT NULL,
	`movimiento_entrada_id` text NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);