/**
 * BottomTabBar — web / desktop variant.
 *
 * Re-exports the shared core directly. Desktop has no home indicator /
 * safe-area inset to account for. Vite resolves this file; Metro picks
 * `bottom-tab-bar.native.tsx` instead.
 */
import type { ReactElement } from 'react';
import { BottomTabBarCore, type BottomTabBarProps } from './bottom-tab-bar.shared';

export { type BottomTabBarProps, type BottomTabBarItem } from './bottom-tab-bar.shared';

export function BottomTabBar(props: BottomTabBarProps): ReactElement {
  return <BottomTabBarCore {...props} />;
}
