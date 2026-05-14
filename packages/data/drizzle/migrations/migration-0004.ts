/**
 * Raw SQL for migration 0004 — adds `hora` column to sales.
 *
 * Audit M-1 PR 7: auto-capture device time at sale creation.
 * Simple ALTER TABLE ADD COLUMN — no data migration needed.
 * Existing rows get NULL (legacy records before hora tracking).
 */

export const migration0004Sql = `-- PR 7: Sale hora (device time at creation)
ALTER TABLE sales ADD COLUMN hora TEXT;`;
