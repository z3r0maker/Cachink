/**
 * GlobalErrorToast — renders a stack of error toasts at the bottom of
 * the screen. Auto-dismisses after a few seconds. Tap to dismiss.
 *
 * Mount once inside AppProviders, as a sibling of the main content.
 *
 * ## Audit 2026-09 — brought onto the design system
 *
 * This component was written against Tamagui's default tokens (`$red3`,
 * `$yellow11`, `$3`, `$mono`) rather than the Cachink palette, so the surface
 * every error in the app passes through did not look like the app. It now uses
 * the §8.3 language: hard 2px black border, hard drop shadow, no blur.
 *
 * The `redText` / `warningText` pair exists precisely for this position —
 * `red` on `redSoft` measures 2.86:1 and fails WCAG AA, while `redText` on the
 * same ground clears it. See `tests/theme.test.ts`.
 *
 * The root is an RN `<Pressable>`, not a Tamagui `<View onPress>`, for the
 * reason documented in `Btn` (audit M-1 STEP0-T01): Tamagui routes `onPress`
 * through a JS pointer-event wrapper that never fires for a synthetic tap from
 * Maestro / XCUI on iOS, so "tap to dismiss" was untestable and, on device,
 * unreliable. It also carries an accessible name — a toast a screen-reader
 * user cannot identify or dismiss is not a dismissable toast.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View, Text } from '@tamagui/core';
import { useErrorToastStore } from '../../observability/error-toast-store';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, radii, shadows, typography } from '../../theme';

interface ToastItemProps {
  readonly toast: { id: string; severity: string; message: string; operation?: string };
  readonly onDismiss: (id: string) => void;
}

/** Severity drives ground, ink and glyph together so they can never drift apart. */
interface Tone {
  readonly background: string;
  readonly ink: string;
  readonly glyph: string;
}

function toneOf(isError: boolean): Tone {
  return isError
    ? { background: colors.redSoft, ink: colors.redText, glyph: '❌' }
    : { background: colors.warningSoft, ink: colors.warningText, glyph: '⚠️' };
}

/** §8.3 surface: hard 2px black border, hard drop shadow, no blur. */
const TOAST_SURFACE = {
  borderWidth: 2,
  borderColor: colors.black,
  borderRadius: radii[1],
  paddingHorizontal: 12,
  paddingVertical: 10,
  boxShadow: shadows.card,
} as const;

function ToastBody({ toast, tone }: { toast: ToastItemProps['toast']; tone: Tone }): ReactElement {
  return (
    <>
      <View flexDirection="row" alignItems="center" gap={8}>
        <Text fontSize={fontSizes.lg}>{tone.glyph}</Text>
        <Text
          flex={1}
          fontFamily={typography.fontFamily}
          fontSize={fontSizes.sm}
          fontWeight={typography.weights.semibold}
          color={tone.ink}
          numberOfLines={2}
        >
          {toast.message}
        </Text>
      </View>
      {toast.operation !== undefined && (
        <Text
          fontFamily={typography.fontFamily}
          fontSize={fontSizes.xs}
          color={colors.gray600}
          marginTop={4}
        >
          {toast.operation}
        </Text>
      )}
    </>
  );
}

function ToastItem({ toast, onDismiss }: ToastItemProps): ReactElement {
  const { t } = useTranslation();
  const tone = toneOf(toast.severity === 'error');
  return (
    <Pressable
      onPress={() => onDismiss(toast.id)}
      role="button"
      aria-label={t('errors.dismissToastAriaLabel', { message: toast.message })}
      testID={`error-toast-${toast.id}`}
      style={{ ...TOAST_SURFACE, backgroundColor: tone.background }}
    >
      <ToastBody toast={toast} tone={tone} />
    </Pressable>
  );
}

export function GlobalErrorToast(): ReactElement | null {
  const toasts = useErrorToastStore((s) => s.toasts);
  const dismiss = useErrorToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View
      position="absolute"
      bottom={90}
      left={12}
      right={12}
      zIndex={9999}
      pointerEvents="box-none"
      gap={8}
      testID="global-error-toast"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}
