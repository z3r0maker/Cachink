/**
 * `<FAB>` — Floating Action Button.
 *
 * Closes audit finding 4.6: every list screen's primary "+ Nueva"
 * action sits in the top-right `<SectionTitle>` action slot. On a
 * phone held one-handed that's outside the thumb arc — users have to
 * shimmy the device to reach it. The mobile design pattern for the
 * primary screen action is a Floating Action Button anchored above
 * the bottom tab bar.
 *
 * Brand-faithful per CLAUDE.md §8.3: 56-pt circle (Material's
 * "regular" FAB diameter, comfortable thumb target), 2-px black
 * border, hard 4×4 black drop shadow, yellow surface, press transform
 * that translates 2 px and shrinks the shadow to 1×1 (the tactile
 * "stamp" feel that defines the brand).
 *
 * Mounted via `position: 'absolute'`, `bottom: 88` (above the §8 brand
 * `BottomTabBar` 72-pt cell + 16-pt margin), `right: 24`. Consumers
 * can override via the `bottom` / `right` props for screens that
 * stack two FABs or live above a different chrome.
 *
 * Single-purpose: takes one `icon` and one `ariaLabel`. The full label
 * lives on the screen header — the FAB is a reach-target shortcut, not
 * the only path. Desktops keep the top-right Btn.
 *
 * ## Same fix as Btn (F0-T04) — `<Pressable>` over `<View onPress>`
 *
 * Uses RN `<Pressable>` for the tappable root so Maestro / XCUI
 * synthetic taps fire reliably on iOS.
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { shadows } from '../../theme';
import { colors } from '../../theme';

export interface FABProps {
  /** Brand icon shown inside the FAB. Pass `<Icon name="plus" size={28} />`. */
  readonly icon: ReactNode;
  /** Required screen-reader label — the FAB is icon-only. */
  readonly ariaLabel: string;
  /** Fires on tap. */
  readonly onPress: () => void;
  /** Distance from the bottom of the parent. Defaults to 88 (above the BottomTabBar). */
  readonly bottom?: number;
  /** Distance from the right of the parent. Defaults to 24. */
  readonly right?: number;
  /** When true, the FAB renders dimmed and rejects taps. */
  readonly disabled?: boolean;
  /** Forwarded to the root View — anchor for E2E tests. */
  readonly testID?: string;
}

const FAB_DIAMETER = 56;
const DEFAULT_BOTTOM = 88;
const DEFAULT_RIGHT = 24;

/** Press transform mirrors §8.3 — translate(2,2) + shadow shrinks to 1×1. */
const PRESS_TRANSFORM: ViewStyle = {
  transform: [{ translateX: 2 }, { translateY: 2 }],
  boxShadow: shadows.pressed,
};

function buildBaseStyle(
  bottom: number,
  right: number,
  disabled: boolean,
): ViewStyle {
  return {
    position: 'absolute',
    bottom,
    right,
    width: FAB_DIAMETER,
    height: FAB_DIAMETER,
    borderRadius: FAB_DIAMETER / 2,
    backgroundColor: colors.yellow,
    borderColor: colors.black,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    boxShadow: shadows.card,
    userSelect: 'none',
  } as ViewStyle;
}

export function FAB(props: FABProps): ReactElement {
  const disabled = props.disabled ?? false;
  const base = buildBaseStyle(
    props.bottom ?? DEFAULT_BOTTOM,
    props.right ?? DEFAULT_RIGHT,
    disabled,
  );
  return (
    <Pressable
      testID={props.testID ?? 'fab'}
      onPress={disabled ? undefined : props.onPress}
      disabled={disabled}
      role="button"
      aria-label={props.ariaLabel}
      aria-disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={props.ariaLabel}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [base, pressed && !disabled ? PRESS_TRANSFORM : null]}
    >
      {props.icon}
    </Pressable>
  );
}
