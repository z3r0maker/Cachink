/**
 * Login screen animation hooks — avatar selection + PIN entry transitions.
 *
 * Uses RN Animated API (native driver) matching the pattern from
 * FloatingCoinsBackground and BlinkingCursor.
 */
import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

const FADE_DURATION = 200;
const SLIDE_DURATION = 300;
const UNSELECTED_OPACITY = 0.45;

/** Fade to target opacity when selection state changes. */
export function useAvatarFade(selected: boolean, isAnySelected: boolean): Animated.Value {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const target = !isAnySelected ? 1 : selected ? 1 : UNSELECTED_OPACITY;
    Animated.timing(opacity, {
      toValue: target,
      duration: FADE_DURATION,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [opacity, selected, isAnySelected]);

  return opacity;
}

/** Scale bounce on the selected avatar. */
export function useAvatarScale(selected: boolean): Animated.Value {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    // Under reduced motion the avatar holds at 1× — `useAvatarFade` already
    // marks the selection through opacity, so nothing is lost but the spring.
    Animated.spring(scale, {
      toValue: selected && !reduced ? 1.1 : 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  }, [scale, selected, reduced]);

  return scale;
}

/** Slide-in for the PIN prompt section. */
export function usePinSlideIn(visible: boolean): {
  translateY: Animated.Value;
  opacity: Animated.Value;
} {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    // The prompt travels 30pt upward on entry. Under reduced motion it starts
    // where it lands, so the transition becomes the pure crossfade WCAG 2.3.3
    // asks for rather than a slide.
    if (reduced) translateY.setValue(0);
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduced ? 0 : SLIDE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(30);
      opacity.setValue(0);
    }
  }, [visible, translateY, opacity]);

  return { translateY, opacity };
}
