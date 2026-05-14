ALTER TABLE sales ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE expenses ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE products ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE inventory_movements ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE employees ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE clients ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE client_payments ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE day_closes ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE recurring_expenses ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN created_by_user_id TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN created_by_user_id TEXT;