CREATE TABLE IF NOT EXISTS `entregas_credito` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`fecha` text NOT NULL,
	`total_centavos` numeric NOT NULL,
	`nota` text,
	`sale_ids` text NOT NULL,
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `director_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`severity` text NOT NULL,
	`title_key` text NOT NULL,
	`message` text NOT NULL,
	`read` integer NOT NULL DEFAULT 0,
	`action_route` text,
	`metadata` text NOT NULL DEFAULT '{}',
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);