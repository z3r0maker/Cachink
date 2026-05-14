/**
 * Migration 0013 — Rename auth columns per ADR-049.
 *
 * PIN for login, Password for recovery:
 *   password_hash → pin_hash
 *   recovery_pin_hash → recovery_password_hash
 *   must_change_password → must_change_pin
 */

export const migration0013Sql = `ALTER TABLE users RENAME COLUMN password_hash TO pin_hash;
--> statement-breakpoint
ALTER TABLE users RENAME COLUMN recovery_pin_hash TO recovery_password_hash;
--> statement-breakpoint
ALTER TABLE users RENAME COLUMN must_change_password TO must_change_pin;`;
