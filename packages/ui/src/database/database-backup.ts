/**
 * Database-backup helper — invoked by `runMigrations` when at least
 * one pending migration exists (P1C-M12-T03, S4-C17).
 *
 * Platform split:
 *   - `.native.ts` uses `expo-sqlite`'s `serialize()` + `expo-file-system`.
 *   - `.web.ts` uses Tauri's fs plugin to copy the SQLite file.
 *
 * Shared types + helpers live in `./database-backup.shared.ts` so the
 * platform variants don't self-cycle through this entry file. The shared
 * entry here re-exports the safe defaults that tests use.
 * Returns the path the backup was written to.
 */

export type { BackupFn } from './database-backup.shared';
export { formatBackupFilename, noopBackup } from './database-backup.shared';
