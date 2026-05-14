/**
 * Migration 0012 — CREATE TABLE entregas_credito + director_alerts.
 * Phase 11 of the Feature Flags plan.
 */

export const migration0012Sql = `CREATE TABLE IF NOT EXISTS \`entregas_credito\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`cliente_id\` text NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`total_centavos\` numeric NOT NULL,
\t\`nota\` text,
\t\`sale_ids\` text NOT NULL,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_by_user_id\` text,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`director_alerts\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`source\` text NOT NULL,
\t\`severity\` text NOT NULL,
\t\`title_key\` text NOT NULL,
\t\`message\` text NOT NULL,
\t\`read\` integer NOT NULL DEFAULT 0,
\t\`action_route\` text,
\t\`metadata\` text NOT NULL DEFAULT '{}',
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_by_user_id\` text,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);`;
