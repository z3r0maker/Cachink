CREATE TABLE `__cachink_change_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_name` text NOT NULL,
	`row_id` text NOT NULL,
	`row_updated_at` text NOT NULL,
	`row_device_id` text NOT NULL,
	`op` text NOT NULL,
	`captured_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	CHECK (op IN ('insert', 'update'))
);
--> statement-breakpoint
CREATE INDEX `idx_cachink_change_log_id` ON `__cachink_change_log` (`id`);
--> statement-breakpoint
CREATE TABLE `__cachink_sync_state` (
	`scope` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `__cachink_conflicts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`detected_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	`direction` text NOT NULL,
	`table_name` text NOT NULL,
	`row_id` text NOT NULL,
	`loser_updated_at` text NOT NULL,
	`loser_device_id` text NOT NULL,
	`winner_updated_at` text NOT NULL,
	`winner_device_id` text NOT NULL,
	`reason` text NOT NULL,
	CHECK (direction IN ('inbound', 'outbound'))
);
--> statement-breakpoint
CREATE INDEX `idx_cachink_conflicts_detected_at` ON `__cachink_conflicts` (`detected_at`);
--> statement-breakpoint
CREATE TRIGGER `trg_sales_ai` AFTER INSERT ON `sales`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_sales_au` AFTER UPDATE ON `sales`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_expenses_ai` AFTER INSERT ON `expenses`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('expenses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_expenses_au` AFTER UPDATE ON `expenses`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('expenses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_products_ai` AFTER INSERT ON `products`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('products', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_products_au` AFTER UPDATE ON `products`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('products', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_inventory_movements_ai` AFTER INSERT ON `inventory_movements`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('inventory_movements', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_inventory_movements_au` AFTER UPDATE ON `inventory_movements`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('inventory_movements', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_employees_ai` AFTER INSERT ON `employees`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('employees', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_employees_au` AFTER UPDATE ON `employees`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('employees', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_clients_ai` AFTER INSERT ON `clients`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('clients', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_clients_au` AFTER UPDATE ON `clients`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('clients', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_client_payments_ai` AFTER INSERT ON `client_payments`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_client_payments_au` AFTER UPDATE ON `client_payments`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_day_closes_ai` AFTER INSERT ON `day_closes`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('day_closes', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_day_closes_au` AFTER UPDATE ON `day_closes`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('day_closes', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_recurring_expenses_ai` AFTER INSERT ON `recurring_expenses`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('recurring_expenses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_recurring_expenses_au` AFTER UPDATE ON `recurring_expenses`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('recurring_expenses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_businesses_ai` AFTER INSERT ON `businesses`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('businesses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER `trg_businesses_au` AFTER UPDATE ON `businesses`
BEGIN
	INSERT INTO `__cachink_change_log` (`table_name`, `row_id`, `row_updated_at`, `row_device_id`, `op`)
	VALUES ('businesses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
