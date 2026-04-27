/**
 * database-backup tests (P1C-M12-T03, S4-C17).
 *
 * Verifies the backup path format + idempotent run behaviour via the
 * pure helpers. Full platform integration is exercised at the C22
 * Maestro + Playwright gate; here we assert contracts.
 */

import { describe, expect, it, vi } from 'vitest';
import { formatBackupFilename, noopBackup } from '../../src/database/database-backup';
import { runMigrations } from '../../src/database/run-migrations';

describe('formatBackupFilename', () => {
  it('includes an ISO-style timestamp + tag', () => {
    const name = formatBackupFilename('0005_add_pagos', new Date('2026-04-24T18:00:00Z'));
    expect(name).toContain('2026-04-24T18-00-00-000Z');
    expect(name).toContain('0005_add_pagos');
    expect(name).toMatch(/^cachink\.db\.backup-/);
    expect(name).toMatch(/\.bak$/);
  });

  it('produces a different filename when called at a different time', () => {
    const a = formatBackupFilename('t', new Date('2026-01-01T00:00:00Z'));
    const b = formatBackupFilename('t', new Date('2026-01-01T00:00:01Z'));
    expect(a).not.toBe(b);
  });
});

describe('runMigrations + backupBefore', () => {
  it('does not call backup when no migrations are pending', async () => {
    const backup = vi.fn().mockResolvedValue('ignored');
    const fakeDb = {
      run: vi.fn().mockResolvedValue(undefined),
      all: vi.fn().mockImplementation(async () => {
        // Pretend every known migration is already applied.
        const mod = await import('@cachink/data/migrations');
        return mod.default.journal.entries.map((e) => ({ tag: e.tag }));
      }),
    };
    await runMigrations(fakeDb as never, { backupBefore: backup });
    expect(backup).not.toHaveBeenCalled();
  });

  it('calls backup exactly once when pending migrations exist', async () => {
    const backup = vi.fn().mockResolvedValue('/tmp/cachink.db.backup');
    const fakeDb = {
      run: vi.fn().mockResolvedValue(undefined),
      all: vi.fn().mockResolvedValue([]),
    };
    await runMigrations(fakeDb as never, { backupBefore: backup });
    expect(backup).toHaveBeenCalledTimes(1);
  });

  it('tolerates a backup failure (does not block migrations)', async () => {
    const backup = vi.fn().mockRejectedValue(new Error('disk full'));
    const fakeDb = {
      run: vi.fn().mockResolvedValue(undefined),
      all: vi.fn().mockResolvedValue([]),
    };
    await expect(runMigrations(fakeDb as never, { backupBefore: backup })).resolves.toBeUndefined();
  });

  it('noopBackup is a safe default', async () => {
    await expect(noopBackup('any')).resolves.toBe('noop');
  });
});
