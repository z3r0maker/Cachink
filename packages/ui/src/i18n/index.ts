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
export { useTranslation, Trans } from 'react-i18next';
export { esMX } from './locales/es-mx';
export type { EsMX } from './locales/es-mx';
