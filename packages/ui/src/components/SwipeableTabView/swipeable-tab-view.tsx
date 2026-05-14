/**
 * SwipeableTabView — web/desktop variant (passthrough).
 *
 * On web and desktop there is no native fling gesture, so this
 * component simply renders its children. The native variant
 * (`swipeable-tab-view.native.tsx`) detects horizontal flings via
 * `react-native-gesture-handler` and calls `onSwipeLeft` / `onSwipeRight`.
 *
 * Both variants share the same props interface so consumers never
 * need platform-specific imports.
 */

import type { ReactElement, ReactNode } from 'react';

export interface SwipeableTabViewProps {
  /** Fires on a left fling (advance to next tab). */
  readonly onSwipeLeft?: () => void;
  /** Fires on a right fling (go to previous tab). */
  readonly onSwipeRight?: () => void;
  readonly children: ReactNode;
}

/** Web/desktop — no swipe gesture, passthrough only. */
export function SwipeableTabView(props: SwipeableTabViewProps): ReactElement {
  return <>{props.children}</>;
}
