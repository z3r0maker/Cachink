/**
 * `loadDesktopPowerSyncDb` graceful-degrade test (Round 3 F10).
 *
 * Mirror of `apps/mobile/tests/shell/use-cloud-handle.test.ts`.
 * Verifies the desktop shell's lazy `@powersync/web` import rejects
 * gracefully when the package isn't installed (the current Phase 1E
 * "Manual install" carry-over state). The shell hook's `.catch`
 * branch surfaces a `console.warn` and the hook returns `null`,
 * leaving consumers on local SQLite.
 */

import { describe, expect, it } from 'vitest';
import { loadDesktopPowerSyncDb } from '../../src/shell/load-cloud-db';

describe('loadDesktopPowerSyncDb (Round 3 F10)', () => {
  it('rejects when @powersync/web is not installed', async () => {
    await expect(loadDesktopPowerSyncDb()).rejects.toThrow();
  });

  it('produces an error message so the shell warning is debuggable', async () => {
    let captured: unknown;
    try {
      await loadDesktopPowerSyncDb();
    } catch (err: unknown) {
      captured = err;
    }
    expect(captured).toBeDefined();
    const message =
      captured instanceof Error
        ? captured.message
        : typeof captured === 'string'
          ? captured
          : String(captured);
    expect(message.length).toBeGreaterThan(0);
  });
});
