/**
 * Database-backup shared types + helpers (no platform extension).
 *
 * Lives separately from `./database-backup.ts` so the platform variants
 * (`database-backup.native.ts`, `database-backup.web.ts`) can pull the
 * `BackupFn` contract + filename helper without Metro/Vite resolving
 * back to the platform-extension entry. Importing `./database-backup`
 * from `database-backup.native.ts` would self-cycle on RN because Metro
 * picks `database-backup.native.ts` first when resolving `./database-backup`.
 */

export type BackupFn = (tagBeingApplied: string) => Promise<string>;

export function formatBackupFilename(tag: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `cachink.db.backup-${stamp}-${tag}.bak`;
}

export const noopBackup: BackupFn = async () => 'noop';
