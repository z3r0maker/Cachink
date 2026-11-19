/**
 * BottomTabBar — React Native variant.
 *
 * Hands the shared `BottomTabBarCore` the `useSafeAreaInsets()` bottom inset,
 * so the tabs clear the iOS home indicator while the current tab's yellow
 * reaches the bottom of the screen, as on the boards.
 *
 * Metro auto-picks this file on mobile via `.native.tsx` resolution.
 * Vite resolves `./bottom-tab-bar.tsx` for web/desktop.
 */
import type { ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarCore, type BottomTabBarProps } from './bottom-tab-bar.shared';

export { type BottomTabBarProps, type BottomTabBarItem } from './bottom-tab-bar.shared';

export function BottomTabBar(props: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  return <BottomTabBarCore {...props} bottomInset={insets.bottom} />;
}
