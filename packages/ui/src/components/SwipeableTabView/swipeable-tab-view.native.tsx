/**
 * SwipeableTabView — mobile (React Native) variant.
 *
 * Uses `Gesture.Fling()` from `react-native-gesture-handler` to detect
 * horizontal fling gestures. A left fling triggers `onSwipeLeft` (next
 * tab) and a right fling triggers `onSwipeRight` (previous tab).
 *
 * Metro auto-picks this file over `./swipeable-tab-view.tsx` on RN,
 * following the same platform-variant pattern as `SwipeableRow`.
 *
 * The `Fling` gesture is velocity-based and fires on quick swipes,
 * which avoids interference with vertical `ScrollView` scrolling.
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { SwipeableTabViewProps } from './swipeable-tab-view';

export { type SwipeableTabViewProps } from './swipeable-tab-view';

/**
 * `GestureDetector` requires a host (native) component as its direct
 * child so it can attach the gesture without `findNodeHandle`. Using
 * RN's `View` instead of Tamagui's `View` (which wraps in a `Wrap` HOC)
 * avoids the StrictMode deprecation warning.
 */
export function SwipeableTabView(props: SwipeableTabViewProps): ReactElement {
  const { onSwipeLeft, onSwipeRight } = props;
  const swipeLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      'worklet';
      if (onSwipeLeft) runOnJS(onSwipeLeft)();
    });
  const swipeRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      'worklet';
      if (onSwipeRight) runOnJS(onSwipeRight)();
    });
  const gesture = Gesture.Race(swipeLeft, swipeRight);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1 }}>{props.children}</View>
    </GestureDetector>
  );
}
