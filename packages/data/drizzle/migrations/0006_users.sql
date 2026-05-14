CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text,
	`password_hash` text NOT NULL,
	`recovery_pin_hash` text NOT NULL,
	`role` text NOT NULL,
	`must_change_password` integer NOT NULL DEFAULT 0,
	`avatar_color` text NOT NULL DEFAULT 'blue',
	`business_id` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);