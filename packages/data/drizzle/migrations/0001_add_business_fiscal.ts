/**
 * Migration 0001 — the business's fiscal data (P-08, README Q15).
 *
 * RFC, razón social, código postal and uso CFDI, all nullable: `businesses` is
 * a DOWN table, so these arrive from the portal on the next pull, and a phone
 * that has never seen them keeps working. Existing rows get NULL — "not yet
 * filled in", which is exactly what they are.
 */

export const migration0001Sql = `
ALTER TABLE businesses ADD COLUMN rfc TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN razon_social TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN codigo_postal TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN uso_cfdi TEXT;
`.trim();
