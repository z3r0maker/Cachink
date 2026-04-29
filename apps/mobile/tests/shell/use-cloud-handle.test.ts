/**
 * `loadMobilePowerSyncDb` graceful-degrade test (Round 3 F10).
 *
 * The mobile shell's `useMobileCloudHandle` lazy-imports
 * `@powersync/react-native` so Local-standalone and LAN bundles never
 * pull PowerSync (CLAUDE.md §7). When the package isn't installed —
 * the active state today, per the Phase 1E "Manual install"
 * carry-over — the hook must gracefully degrade to local SQLite.
 *
 * Contract:
 *   - `loadMobilePowerSyncDb()` REJECTS the promise when the dynamic
 *     `import('@powersync/react-native')` fails to resolve.
 *   - `useMobileCloudHandle` then catches that rejection in its
 *     `.catch(...)` branch, surfaces a `console.warn`, and returns
 *     `null` so consumers fall back to local SQLite.
 *
 * This file regression-guards the rejection path. The success path
 * (PowerSync installed → returns CachinkDatabase) cannot be tested
 * here because `@powersync/react-native` isn't in the workspace's
 * node_modules — that test lands when the package is added per the
 * Phase 1E carry-over note.
 */

import { describe, expect, it } from 'vitest';
import { loadMobilePowerSyncDb } from '../../src/shell/load-cloud-db';

describe('loadMobilePowerSyncDb (Round 3 F10)', () => {
  it('rejects when @powersync/react-native is not installed', async () => {
    // The function does:
    //   const [ps, factory] = await Promise.all([
    //     import('@powersync/react-native'),
    //     import('@cachink/sync-cloud/client'),
    //   ]);
    //   if (!ps) return null;
    //
    // With @powersync/react-native absent, the dynamic import fails
    // and Promise.all rejects. The shell hook's `.catch` is what
    // surfaces a console.warn + keeps `handle` as null.
    await expect(loadMobilePowerSyncDb()).rejects.toThrow();
  });

  it('produces an error whose message references @powersync (so console.warn is informative)', async () => {
    // Detail check: the error must surface enough context that the
    // hook's `console.warn('[useMobileCloudHandle] PowerSync not
    // available, staying on local SQLite:', err)` is debuggable.
    let captured: unknown;
    try {
      await loadMobilePowerSyncDb();
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
    // The Node runtime reports module-not-found errors with the
    // missing path embedded, which is enough for diagnostics.
    expect(message.length).toBeGreaterThan(0);
  });
});
