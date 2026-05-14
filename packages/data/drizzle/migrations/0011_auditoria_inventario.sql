CREATE TABLE IF NOT EXISTS `auditorias_inventario` (
	`id` text PRIMARY KEY NOT NULL,
	`fecha` text NOT NULL,
	`estado` text NOT NULL,
	`lineas` text NOT NULL,
	`total_discrepancias` integer NOT NULL DEFAULT 0,
	`total_productos` integer NOT NULL,
	`productos_contados` integer NOT NULL DEFAULT 0,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);