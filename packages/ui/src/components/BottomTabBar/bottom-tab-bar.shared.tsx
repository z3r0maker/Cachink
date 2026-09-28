/**
 * BottomTabBar — shared layout core.
 *
 * Sticky horizontal strip used by both apps' shells (3-tab Operativo, 6-tab
 * Director). Per CLAUDE.md §1, the supported range is 1..6 items; a count
 * outside that range emits a dev-mode warning and renders the first 6
 * (no crash).
 *
 * Platform variants import `BottomTabBarCore` and wrap it with any
 * platform-specific insets (e.g. bottom safe-area on iOS).
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { borderWidths, colors } from '../../theme';
import { TabItem } from './tab-item';

export interface BottomTabBarItem {
  /** Stable id matched against `activeKey`. */
  readonly key: string;
  /** Tab label (proper-cased; uppercase is a CSS transform). */
  readonly label: string;
  /** Optional icon slot (any ReactNode — emoji, SVG, icon-lib component). */
  readonly icon?: ReactNode;
  /** Fires on press/tap. */
  readonly onPress: () => void;
  /** Optional small red badge with count (e.g. pendientes). */
  readonly badge?: number;
  /** Forwarded to the rendered tab cell so E2E tests can anchor to it. */
  readonly testID?: string;
}

export interface BottomTabBarProps {
  /** Tabs to render. Length 1..6 per CLAUDE.md §1. */
  readonly items: readonly BottomTabBarItem[];
  /** `key` of the currently active tab. */
  readonly activeKey: string;
  /** Forwarded to the root container so E2E tests can anchor to it. */
  readonly testID?: string;
}

const MIN_ITEMS = 1;
const MAX_ITEMS = 6;

function clampItems(items: readonly BottomTabBarItem[]): readonly BottomTabBarItem[] {
  if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) {
    // Dev-mode warning — renders the first 6 to stay crash-free.
    console.warn(
      `BottomTabBar expects 1..6 items; got ${items.length}. Rendering the first ${MAX_ITEMS}.`,
    );
    return items.slice(0, MAX_ITEMS);
  }
  return items;
}

/**
 * Core bottom navigation strip — platform-agnostic. See
 * `bottom-tab-bar.stories.tsx` for the full variant catalog.
 *
 * El Mostrador's phone tab bar (the boards' frame, MvTurno): 64 px, white,
 * a 2 px black rule on top; the current tab is filled yellow with black
 * sides (`TabItem`). The caja shows exactly four tabs (`appTabs()`).
 */
export function BottomTabBarCore(props: BottomTabBarProps): ReactElement {
  const items = clampItems(props.items);
  return (
    <View
      testID={props.testID ?? 'bottom-tab-bar'}
      flexDirection="row"
      role="tablist"
      height={64}
      backgroundColor={colors.white}
      borderTopWidth={borderWidths.thin}
      borderTopColor={colors.black}
    >
      {items.map((item) => (
        <TabItem
          key={item.key}
          label={item.label}
          icon={item.icon}
          active={item.key === props.activeKey}
          onPress={item.onPress}
          badge={item.badge}
          testID={item.testID ?? `tab-${item.key}`}
        />
      ))}
    </View>
  );
}
