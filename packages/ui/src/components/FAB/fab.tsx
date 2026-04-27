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
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { colors, shadows } from '../../theme';

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
const FAB_PRESSED = {
  transform: [{ translateX: 2 }, { translateY: 2 }] as const,
  style: { boxShadow: shadows.pressed },
};

export function FAB(props: FABProps): ReactElement {
  const disabled = props.disabled ?? false;
  return (
    <View
      testID={props.testID ?? 'fab'}
      onPress={disabled ? undefined : props.onPress}
      pressStyle={disabled ? {} : FAB_PRESSED}
      position="absolute"
      bottom={props.bottom ?? DEFAULT_BOTTOM}
      right={props.right ?? DEFAULT_RIGHT}
      width={FAB_DIAMETER}
      height={FAB_DIAMETER}
      borderRadius={FAB_DIAMETER / 2}
      backgroundColor={colors.yellow}
      borderColor={colors.black}
      borderWidth={2}
      alignItems="center"
      justifyContent="center"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      role="button"
      aria-label={props.ariaLabel}
      aria-disabled={disabled}
      // Hit-slop pushes the effective touch area to ~64 pt on every
      // edge — well above the 44-pt iOS HIG minimum.
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={{
        boxShadow: shadows.card,
        userSelect: 'none',
        // Override: brand circle visual via aspect-ratio fallback so
        // RN renders true round; web rounds via borderRadius alone.
        borderRadius: FAB_DIAMETER / 2,
      }}
    >
      {props.icon}
    </View>
  );
}
