/**
 * useShakeAnimation — horizontal shake sequence for error feedback.
 *
 * Fires a rapid left-right-center oscillation using RN Animated,
 * matching the iOS keychain / bank-app pattern.
 */
import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

const SHAKE_DISTANCE = 10;
const SHAKE_DURATION = 60;

const SHAKE_SEQUENCE = [
  SHAKE_DISTANCE,
  -SHAKE_DISTANCE,
  SHAKE_DISTANCE / 2,
  -SHAKE_DISTANCE / 2,
  0,
] as const;

export function useShakeAnimation(): {
  translateX: Animated.Value;
  triggerShake: () => void;
} {
  const translateX = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    const steps = SHAKE_SEQUENCE.map((toValue) =>
      Animated.timing(translateX, {
        toValue,
        duration: SHAKE_DURATION,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    );
    Animated.sequence(steps).start();
  }, [translateX]);

  return { translateX, triggerShake };
}
