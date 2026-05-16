/**
 * Module augmentation for i18next so `t('actions.save')` is fully typed.
 *
 * The default namespace is `'translation'`, and the resources type is the
 * compile-time shape of `esMX`. Any typo (`t('action.save')`, missing key,
 * wrong nesting) becomes a TypeScript error at the call site instead of a
 * silent empty-string fallback at runtime.
 *
 * Excluded from ESLint via the global `**\/*.d.ts` ignore in the shared
 * eslint.config.js — this file is type-only.
 */
import type { EsMX } from './locales/es-mx';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: EsMX };
    returnNull: false;
    returnDetails: false;
    returnObjects: false;
    parseInterpolation: false;
  }
}

/**
 * Simplified translate-function signature for prop drilling.
 *
 * i18next 26.x's `TFunction` is heavily overloaded and can trigger
 * "Type instantiation is excessively deep" on large resource trees.
 * Use this alias when passing `t` as a prop instead of calling it
 * directly from `useTranslation`.
 */
export type TranslateFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;
