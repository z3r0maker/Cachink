/**
 * Migration 0004 — rename the sync infrastructure tables for the
 * Cachink → Xangarro rebrand (ADR-056).
 *
 * The `__cachink_*` names below are intentional legacy references: they are
 * the tables 0000 created on every install before the rebrand. Applied
 * migrations are immutable, so the rename happens here instead.
 *
 *   - `ALTER TABLE … RENAME` keeps every row and the AUTOINCREMENT
 *     `sqlite_sequence` entry, so new change-log ids never fall at or below
 *     a stored push HWM.
 *   - SQLite (≥ 3.26, legacy_alter_table off) rewrites the bodies of the
 *     `trg_*_ai` / `trg_*_au` change-log triggers from 0000 and 0001 to the
 *     new table name. No trigger is dropped or recreated.
 *   - Index names are not rewritten, so the conflicts index is recreated.
 *
 * `__cachink_migrations` is renamed by the runner (`legacy-tracker.ts`)
 * before it reads applied tags, and `__cachink_observability_log` by
 * `@xangarro/observability`, because neither is created by a migration.
 */

export const migration0004Sql = `
-- 0004_xangarro_sync_tables
--> statement-breakpoint
ALTER TABLE __cachink_change_log RENAME TO __xangarro_change_log
--> statement-breakpoint
ALTER TABLE __cachink_sync_state RENAME TO __xangarro_sync_state
--> statement-breakpoint
ALTER TABLE __cachink_conflicts RENAME TO __xangarro_conflicts
--> statement-breakpoint
DROP INDEX idx_cachink_conflicts_detected_at
--> statement-breakpoint
CREATE INDEX idx_xangarro_conflicts_detected_at ON __xangarro_conflicts (detected_at)
`.trim();
