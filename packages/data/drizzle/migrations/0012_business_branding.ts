/**
 * Migration 0012 — branding and contact columns on `businesses` (C-15).
 *
 * The wire has carried these since the domain schema defaulted them, and
 * Postgres since data-pg 0023 (`direccion` since 0028); the phone dropped
 * them on the way in. This is the SQLite half: the same seven columns, the
 * same defaults, so a pull writes what the portal set and a receipt printed
 * on a phone reads the same branding as one printed from the portal.
 *
 * Defaults match the wire exactly — `receipt_template` 'clasico',
 * `address_print` false, `social_links` '{}' (a JSON string, this table's own
 * `feature_flags` precedent), the rest null. Existing rows therefore keep
 * parsing unchanged, and `logo_url` (already here since 0000) is untouched.
 *
 * SQLite has no CHECK on the template: the enum is enforced by
 * `ReceiptTemplateEnum` on both the wire and the repository boundary, and
 * adding a constraint to an existing table would mean rebuilding it.
 */

export const migration0012Sql = `
-- 0012_business_branding
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN brand_color TEXT
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN receipt_template TEXT NOT NULL DEFAULT 'clasico'
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN receipt_leyenda TEXT
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN address_print INTEGER NOT NULL DEFAULT 0
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN whatsapp TEXT
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN direccion TEXT
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN social_links TEXT NOT NULL DEFAULT '{}'
`;
