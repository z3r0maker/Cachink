/**
 * Migration 0011 — CREATE TABLE auditorias_inventario.
 * Phase 10 of the Feature Flags plan.
 */

export const migration0011Sql = `CREATE TABLE IF NOT EXISTS \`auditorias_inventario\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`estado\` text NOT NULL,
\t\`lineas\` text NOT NULL,
\t\`total_discrepancias\` integer NOT NULL DEFAULT 0,
\t\`total_productos\` integer NOT NULL,
\t\`productos_contados\` integer NOT NULL DEFAULT 0,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_by_user_id\` text,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);`;
