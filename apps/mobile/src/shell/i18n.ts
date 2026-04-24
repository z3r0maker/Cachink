/**
 * Shell-level i18n bootstrap for `apps/mobile`.
 *
 * Calls `initI18n()` exactly once before the first render. Per CLAUDE.md
 * §8.5 the locale is pinned to `es-MX`; `expo-localization` is imported
 * here so a future locale-detection switch is a one-file change rather
 * than a workspace-wide refactor.
 *
 * Belongs in `shell/` per CLAUDE.md §5.6 — this is platform bootstrap, not
 * a reusable component.
 */

// `expo-localization` is intentionally side-effect-imported but not used:
// it pre-warms the native module so future locale-detection lands cheaply.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Localization from 'expo-localization';
import { initI18n } from '@cachink/ui/i18n';

export function bootstrapI18n(): void {
  initI18n();
}

// Touch the import so bundlers don't tree-shake it away in release builds.
void Localization;
