/**
 * Haptics — native implementation via expo-haptics.
 *
 * Metro resolves this file over `haptics.ts` on iOS / Android.
 * Each function fires-and-forgets the Haptics promise — we never
 * need the result, and awaiting would slow down the UI thread.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - expo-haptics is a peer dep resolved by Metro at runtime
import * as Haptics from 'expo-haptics';

/** Light tap — product add, button tap, toggle change. */
export function impactLight(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — swipe complete, FAB press, long-press remove. */
export function impactMedium(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Success notification — checkout confirm, scan success. */
export function notificationSuccess(): void {
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  );
}

/** Error notification — clear-all confirm, failed action. */
export function notificationError(): void {
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Error,
  );
}
