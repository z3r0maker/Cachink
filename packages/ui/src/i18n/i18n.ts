/**
 * i18next instance for `@cachink/ui`.
 *
 * The single source of truth for i18n bootstrapping. Both apps (mobile and
 * desktop) call `initI18n()` from their shells before rendering any
 * component that uses `t(...)`. The function is idempotent so duplicate
 * calls (e.g. during Fast Refresh) don't reset the instance.
 *
 * Locale is pinned to `es-MX` per CLAUDE.md §8.5 — language-detection /
 * switching arrives in a later phase, at which point only this file
 * changes.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { esMX } from './locales/es-mx';

const DEFAULT_LOCALE = 'es-MX' as const;

export function initI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n;
  void i18n.use(initReactI18next).init({
    resources: { [DEFAULT_LOCALE]: { translation: esMX } },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false }, // React handles escaping.
    returnNull: false,
  });
  return i18n;
}

export { i18n };
