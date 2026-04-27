/**
 * SwipeableRow — mobile (React Native) variant (audit M-1 PR 4.5-T09).
 *
 * Wraps the row in `react-native-gesture-handler`'s `Swipeable` so users
 * can left-swipe to reach the Edit affordance and right-swipe to reach
 * the Delete affordance. Metro auto-picks this file over
 * `./swipeable-row.tsx` (and `.web.tsx`) on RN.
 *
 * **Why the legacy `Swipeable` over `ReanimatedSwipeable`:** the
 * Reanimated v4 path requires the `react-native-reanimated/plugin`
 * babel plugin to be wired in `babel.config.js`. The legacy
 * `Swipeable` uses RN's built-in `Animated` API and works without any
 * babel-plugin setup — keeping the dep footprint at one direct
 * package (gesture-handler) instead of two. When the app needs
 * Reanimated for other reasons (skeletons, transitions), this
 * variant can swap to `ReanimatedSwipeable` in a follow-up slice.
 *
 * **Action panel rendering:** brand-faithful per CLAUDE.md §8 — yellow
 * Edit panel with `pencil` icon (matches the §8.1 brand palette);
 * red Delete panel with `trash-2` icon (matches §8.1 `colors.red`).
 * Both panels ship the §8.3 hard 2-px black border and clamp text at
 * the standard `<BtnLabel>` shape so Spanish copy never overflows.
 *
 * **Accessibility contract:**
 *   - `accessibilityLabel` is forwarded from the shared `ariaLabel`
 *     prop so VoiceOver / TalkBack announce the swipe options.
 *   - The swipe is **never** the only entry point — every mounted
 *     SwipeableRow must compose with a tap-to-detail or
 *     long-press-menu fallback (audit 3.6 + 3.7). Suppressing the
 *     swipe via `disabled={true}` keeps the row usable.
 */

import type { ReactElement, ReactNode } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - react-native-gesture-handler is a peer dep resolved by
// Metro at runtime. The mobile app's package.json adds it; Vite tools
// (Vitest, Storybook, Tauri) never traverse this file.
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Text, View } from '@tamagui/core';
import { Icon } from '../Icon/index';
import { colors, typography } from '../../theme';
import type { SwipeableRowProps } from './swipeable-row';

const ACTION_WIDTH = 80;

interface ActionPanelProps {
  readonly label: string;
  readonly background: string;
  readonly textColor: string;
  readonly icon: 'pencil' | 'trash-2';
  readonly side: 'left' | 'right';
  readonly testID: string;
}

function ActionPanel(props: ActionPanelProps): ReactElement {
  return (
    <View
      testID={props.testID}
      width={ACTION_WIDTH}
      backgroundColor={props.background}
      borderColor={colors.black}
      borderWidth={2}
      alignItems="center"
      justifyContent="center"
      // Borrows the §8 hard-edge geometry: the panel sits flush against
      // the row, so the border that touches the row is suppressed.
      borderLeftWidth={props.side === 'right' ? 2 : 0}
      borderRightWidth={props.side === 'left' ? 2 : 0}
      gap={4}
    >
      <Icon name={props.icon} size={20} color={props.textColor} />
      <Text
        color={props.textColor}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={11}
        letterSpacing={typography.letterSpacing.wide}
        numberOfLines={1}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={1.3}
        style={{ textTransform: 'uppercase' }}
      >
        {props.label}
      </Text>
    </View>
  );
}

function defaultLeftAction(): ReactElement {
  return (
    <ActionPanel
      label="Editar"
      background={colors.yellow}
      textColor={colors.black}
      icon="pencil"
      side="left"
      testID="swipeable-row-edit-action"
    />
  );
}

function defaultRightAction(): ReactElement {
  return (
    <ActionPanel
      label="Borrar"
      background={colors.red}
      textColor={colors.white}
      icon="trash-2"
      side="right"
      testID="swipeable-row-delete-action"
    />
  );
}

function renderLeftActions(custom: ReactNode | undefined): () => ReactNode {
  if (custom !== undefined) {
    return () => custom;
  }
  return defaultLeftAction;
}

function renderRightActions(custom: ReactNode | undefined): () => ReactNode {
  if (custom !== undefined) {
    return () => custom;
  }
  return defaultRightAction;
}

export function SwipeableRow(props: SwipeableRowProps): ReactElement {
  const isDisabled = props.disabled === true;
  const hasLeftSwipe = !isDisabled && props.onSwipeLeft !== undefined;
  const hasRightSwipe = !isDisabled && props.onSwipeRight !== undefined;

  if (!hasLeftSwipe && !hasRightSwipe) {
    // No swipe configured (or disabled) — render passthrough so the
    // row's tap-to-detail / long-press-menu fallbacks work as if
    // SwipeableRow weren't mounted.
    return (
      <View testID={props.testID ?? 'swipeable-row'} accessibilityLabel={props.ariaLabel}>
        {props.children}
      </View>
    );
  }

  return (
    <Swipeable
      testID={props.testID ?? 'swipeable-row'}
      renderLeftActions={hasLeftSwipe ? renderLeftActions(props.leftAction) : undefined}
      renderRightActions={hasRightSwipe ? renderRightActions(props.rightAction) : undefined}
      onSwipeableOpen={(direction: 'left' | 'right') => {
        if (direction === 'left' && props.onSwipeLeft !== undefined) {
          props.onSwipeLeft();
        } else if (direction === 'right' && props.onSwipeRight !== undefined) {
          props.onSwipeRight();
        }
      }}
      // Audit 3.6 — the row must remain accessible by tap; gesture-handler
      // can ignore short taps so the underlying onPress handler still fires.
      friction={2}
      leftThreshold={ACTION_WIDTH * 0.6}
      rightThreshold={ACTION_WIDTH * 0.6}
    >
      {/*
        Audit M-1 Step 0: react-native-gesture-handler 2.31.x removed the
        `accessibilityLabel` prop from `<Swipeable>`'s public types. We
        forward `ariaLabel` to a wrapper `<View>` so VoiceOver / TalkBack
        still announce the row label. Same DOM/native-tree depth before
        and after the upgrade.
      */}
      <View accessibilityLabel={props.ariaLabel}>{props.children}</View>
    </Swipeable>
  );
}
