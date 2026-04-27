/**
 * `loadDesktopUpdateAdapter` graceful-degrade test (Round 3 F11).
 *
 * Mirror of `apps/mobile/tests/shell/use-update-adapter.test.ts`.
 * The desktop shell's `useDesktopUpdateAdapter` lazy-imports
 * `@tauri-apps/plugin-updater`. When the dep isn't installed, the
 * adapter stays `null` and `useCheckForUpdates` resolves to
 * `'unsupported'`.
 */

import { describe, expect, it } from 'vitest';
import { loadDesktopUpdateAdapter } from '../../src/shell/use-update-adapter';

describe('loadDesktopUpdateAdapter (Round 3 F11)', () => {
  it('rejects when @tauri-apps/plugin-updater is not installed', async () => {
    await expect(loadDesktopUpdateAdapter()).rejects.toThrow();
  });

  it('produces an error with a message body so debug logs are useful', async () => {
    let captured: unknown;
    try {
      await loadDesktopUpdateAdapter();
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
