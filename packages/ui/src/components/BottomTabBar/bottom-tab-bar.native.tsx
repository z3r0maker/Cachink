/**
 * BottomTabBar — React Native variant.
 *
 * Wraps the shared `BottomTabBarCore` and adds `paddingBottom` from
 * `useSafeAreaInsets()` so the tab strip clears the iOS home indicator
 * (gesture zone) on notched devices. Without this, tap targets overlap
 * the system gesture area.
 *
 * Metro auto-picks this file on mobile via `.native.tsx` resolution.
 * Vite resolves `./bottom-tab-bar.tsx` for web/desktop.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarCore, type BottomTabBarProps } from './bottom-tab-bar.shared';

export { type BottomTabBarProps, type BottomTabBarItem } from './bottom-tab-bar.shared';

export function BottomTabBar(props: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View paddingBottom={insets.bottom}>
      <BottomTabBarCore {...props} />
    </View>
  );
}
