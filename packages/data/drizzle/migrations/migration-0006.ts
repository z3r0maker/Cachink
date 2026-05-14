/**
 * Migration 0006 — CREATE TABLE users.
 *
 * Phase 1 of the Feature Flags plan: user management + auth.
 * Fresh table — no data migration needed from existing rows.
 */

export const migration0006Sql = `CREATE TABLE IF NOT EXISTS \`users\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`nombre\` text NOT NULL,
\t\`email\` text,
\t\`password_hash\` text NOT NULL,
\t\`recovery_pin_hash\` text NOT NULL,
\t\`role\` text NOT NULL,
\t\`must_change_password\` integer NOT NULL DEFAULT 0,
\t\`avatar_color\` text NOT NULL DEFAULT 'blue',
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);`;
