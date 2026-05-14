/**
 * Migration 0009 — CREATE TABLE caja_turnos.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

export const migration0009Sql = `CREATE TABLE IF NOT EXISTS \`caja_turnos\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`user_id\` text NOT NULL,
\t\`fecha\` text NOT NULL,
\t\`apertura_at\` text NOT NULL,
\t\`cierre_at\` text,
\t\`monto_apertura_centavos\` numeric NOT NULL,
\t\`efectivo_adicional_centavos\` numeric NOT NULL,
\t\`monto_cierre_centavos\` numeric,
\t\`efectivo_esperado_centavos\` numeric,
\t\`diferencia_centavos\` numeric,
\t\`discrepancy_reason\` text,
\t\`explicacion\` text,
\t\`total_transferencias\` numeric NOT NULL DEFAULT 0,
\t\`total_tarjeta\` numeric NOT NULL DEFAULT 0,
\t\`total_qr\` numeric NOT NULL DEFAULT 0,
\t\`total_credito\` numeric NOT NULL DEFAULT 0,
\t\`egreso_auto_id\` text,
\t\`business_id\` text NOT NULL,
\t\`device_id\` text NOT NULL,
\t\`created_by_user_id\` text,
\t\`created_at\` text NOT NULL,
\t\`updated_at\` text NOT NULL,
\t\`deleted_at\` text
);`;
