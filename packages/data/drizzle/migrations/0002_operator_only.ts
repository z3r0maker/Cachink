/**
 * Migration 0002 — operator-only users (A-05, ADR-053).
 *
 * The device has one role, operators and PINs are managed in the portal, and
 * operators never carry an email over the wire (docs/plan/02-contracts.md §5).
 * Drops `users.role`, `must_change_pin`, `recovery_password_hash` and `email`.
 * Every other column and every row is kept; `permissions` stays and is now
 * synced from the portal.
 */

export const migration0002Sql = `
-- 0002_operator_only
--> statement-breakpoint
ALTER TABLE users DROP COLUMN role
--> statement-breakpoint
ALTER TABLE users DROP COLUMN must_change_pin
--> statement-breakpoint
ALTER TABLE users DROP COLUMN recovery_password_hash
--> statement-breakpoint
ALTER TABLE users DROP COLUMN email
`;
