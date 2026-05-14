/**
 * Raw SQL for migration 0005 — adds `color_fondo` column to products.
 *
 * Soft background color for visual categorization. Default 'white'.
 * Simple ALTER TABLE ADD COLUMN — no data migration needed.
 * Existing rows get 'white' (the default).
 */

export const migration0005Sql = `-- Product color_fondo (visual categorization)
ALTER TABLE products ADD COLUMN color_fondo TEXT NOT NULL DEFAULT 'white';`;
