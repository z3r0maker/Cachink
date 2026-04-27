/**
 * `loadMobileUpdateAdapter` graceful-degrade test (Round 3 F11).
 *
 * The mobile shell's `useMobileUpdateAdapter` lazy-imports
 * `expo-updates` so the module is absent in dev/web previews and
 * unit tests where the Expo runtime isn't booting. When the import
 * fails, `useMobileUpdateAdapter` must keep `adapter === null` and
 * `useCheckForUpdates` then resolves to `'unsupported'` (the
 * disabled-row state in Settings).
 *
 * Round 3 F11 adds a regression guard for the helper's contract:
 *   - `loadMobileUpdateAdapter()` REJECTS when expo-updates is not
 *     installed (the active state outside Expo).
 *   - The shell hook's `.catch(() => { /* leave null * /})` swallows
 *     the rejection — verified indirectly: this test asserts the
 *     helper rejects so the catch path is exercised at runtime.
 */

import { describe, expect, it } from 'vitest';
import { loadMobileUpdateAdapter } from '../../src/shell/use-update-adapter';

describe('loadMobileUpdateAdapter (Round 3 F11)', () => {
  it('rejects when expo-updates is not installed', async () => {
    await expect(loadMobileUpdateAdapter()).rejects.toThrow();
  });

  it('produces an error with a message body so debug logs are useful', async () => {
    let captured: unknown;
    try {
      await loadMobileUpdateAdapter();
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
