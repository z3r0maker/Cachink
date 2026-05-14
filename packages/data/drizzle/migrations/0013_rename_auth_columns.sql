ALTER TABLE users RENAME COLUMN password_hash TO pin_hash;
--> statement-breakpoint
ALTER TABLE users RENAME COLUMN recovery_pin_hash TO recovery_password_hash;
--> statement-breakpoint
ALTER TABLE users RENAME COLUMN must_change_password TO must_change_pin;
