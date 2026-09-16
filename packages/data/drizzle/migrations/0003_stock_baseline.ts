/**
 * Migration 0003 — local stock baseline (A-11).
 *
 * Stock is the sum of a product's inventory movements. The 90-day retention
 * purge deletes old, server-acknowledged movements, so before deleting them
 * it folds their net quantity into `__stock_baseline`; `sumStock` adds the
 * baseline back. Device-local and never synced (not in the change log): the
 * server keeps every movement.
 */

export const migration0003Sql = `
-- 0003_stock_baseline
--> statement-breakpoint
CREATE TABLE __stock_baseline (
  producto_id TEXT PRIMARY KEY NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0
)
`;
