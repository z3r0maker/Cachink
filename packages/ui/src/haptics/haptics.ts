/**
 * Haptics — web / desktop no-op.
 *
 * On native, Metro resolves `haptics.native.ts` instead of this file.
 * On web/desktop, these stubs ensure haptic calls compile and run without
 * errors — they simply do nothing.
 */

/** Light tap — product add, button tap, toggle change. */
export function impactLight(): void {
  /* no-op on web */
}

/** Medium tap — swipe complete, FAB press, long-press remove. */
export function impactMedium(): void {
  /* no-op on web */
}

/** Success notification — checkout confirm, scan success. */
export function notificationSuccess(): void {
  /* no-op on web */
}

/** Error notification — clear-all confirm, failed action. */
export function notificationError(): void {
  /* no-op on web */
}
