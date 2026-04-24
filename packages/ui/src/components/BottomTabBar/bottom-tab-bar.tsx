/**
 * BottomTabBar — the Cachink bottom navigation primitive.
 *
 * Sticky horizontal strip used by both apps' shells (3-tab Operativo, 6-tab
 * Director). Per CLAUDE.md §1, the supported range is 1..6 items; a count
 * outside that range emits a dev-mode warning and renders the first 6
 * (no crash).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * The `icon` slot on each item is `ReactNode`. Phase 1A intentionally does
 * not pick an icon library — the choice is deferred to Phase 1C, where
 * concrete screen needs will inform the decision. Stories use emoji
 * placeholders.
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { colors } from '../../theme';
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

function clampItems(
  items: readonly BottomTabBarItem[],
): readonly BottomTabBarItem[] {
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
 * Renders the canonical Cachink bottom navigation strip. See
 * `bottom-tab-bar.stories.tsx` for the full variant catalog.
 */
export function BottomTabBar(props: BottomTabBarProps): ReactElement {
  const items = clampItems(props.items);
  return (
    <View
      testID={props.testID ?? 'bottom-tab-bar'}
      flexDirection="row"
      height={68}
      backgroundColor={colors.white}
      borderTopWidth={2.5}
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
