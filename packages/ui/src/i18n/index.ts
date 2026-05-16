/**
 * Public surface of `@cachink/ui/i18n`.
 *
 * Apps consume `initI18n()` once from their shell (see
 * `apps/mobile/src/shell/i18n.ts` and `apps/desktop/src/shell/i18n.ts`),
 * then use `useTranslation` and `t` exactly as they would directly from
 * `react-i18next` — but with strict types pinned to the es-MX namespace
 * via `./types.d.ts`.
 */
export { initI18n, i18n } from './i18n';
export { Trans } from 'react-i18next';
export { esMX } from './locales/es-mx';
export type { EsMX } from './locales/es-mx';
export type { TranslateFunction } from './types';

import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { TranslateFunction } from './types';

/**
 * Project wrapper around `useTranslation` that narrows `t` to
 * `TranslateFunction`.
 *
 * i18next 26.x's `TFunction` is heavily overloaded and triggers
 * "Type instantiation is excessively deep" on our 1 200-key es-MX
 * resource tree. Narrowing the return type keeps runtime behaviour
 * identical while preventing compile-time depth explosions.
 *
 * Key validation is still enforced by the module augmentation in
 * `./types.d.ts` — callers just lose auto-complete for key paths,
 * which is an acceptable trade-off for a clean build.
 */
export function useTranslation(): {
  readonly t: TranslateFunction;
  readonly i18n: ReturnType<typeof useI18nTranslation>['i18n'];
  readonly ready: boolean;
} {
  return useI18nTranslation() as ReturnType<typeof useTranslation>;
}
