/**
 * Shell-level i18n bootstrap for `apps/desktop`.
 *
 * Calls `initI18n()` exactly once before the first render. Per CLAUDE.md
 * §8.5 the locale is pinned to `es-MX`. The Tauri webview uses
 * `navigator.language` as a fallback when locale detection arrives in a
 * later phase — no extra dep is needed today.
 *
 * Belongs in `shell/` per CLAUDE.md §5.6 — this is platform bootstrap, not
 * a reusable component.
 */
import { initI18n } from '@cachink/ui/i18n';

export function bootstrapI18n(): void {
  initI18n();
}
