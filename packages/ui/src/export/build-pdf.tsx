/**
 * Re-export shim (P-34): the PDF layout moved to `@xangarro/application` —
 * next to `GenerarInformeMensualUseCase` and the `InformeMensual` type — so
 * the portal renders the same document the phone does without importing this
 * Tamagui-shaped package. No call site changes, the P-22 `theme.ts` pattern.
 */
export { buildInformeMensualPdf, buildViewModel } from '@xangarro/application';
