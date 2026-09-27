/**
 * useEnterMotion — El Mostrador's entrance motions for the phone
 * (docs/design/el-mostrador.md §6): the sheet slides up (280 ms, the web
 * panel's slide), the dialog and the toast pop from 0.94 (220 ms). Under
 * Reduce Motion both collapse to a near-instant fade, so the surface still
 * arrives but nothing moves (`useReducedMotion`).
 *
 * Returns an `Animated` style for an `Animated.View`. The native driver is
 * used off the web, where react-native-web has none.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { motionDuration, useReducedMotion } from '../../hooks/use-reduced-motion';

export type EnterMotion = 'slide' | 'pop';

const DURATION: Record<EnterMotion, number> = { slide: 280, pop: 220 };
/** How far the sheet travels, in px; the scale the pop starts from. */
const SLIDE_FROM = 48;
const POP_FROM = 0.94;

export interface EnterMotionStyle {
  readonly opacity: Animated.AnimatedInterpolation<number>;
  readonly transform: readonly (
    | { translateY: Animated.AnimatedInterpolation<number> }
    | { scale: Animated.AnimatedInterpolation<number> }
  )[];
}

export function useEnterMotion(kind: EnterMotion): EnterMotionStyle {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = Animated.timing(progress, {
      toValue: 1,
      duration: motionDuration(DURATION[kind], reduced),
      easing: Easing.bezier(0.2, 0.8, 0.3, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    run.start();
    return () => run.stop();
  }, [progress, kind, reduced]);
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  // Reduced motion keeps the fade and drops the travel.
  const still = reduced ? 1 : 0;
  if (kind === 'slide') {
    const from = still ? 0 : SLIDE_FROM;
    const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
    return { opacity, transform: [{ translateY }] };
  }
  const from = still ? 1 : POP_FROM;
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 1] });
  return { opacity, transform: [{ scale }] };
}
