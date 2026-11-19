/**
 * «Captura», El Mostrador's fifth motion (ADR-149 §6, board CgCaptura): what
 * every camera that takes a photo does when the shutter fires.
 *
 * - {@link useDestello}: a white flash over the viewfinder, up to 0.85 in
 *   40 ms and back to nothing by 180 ms, and a light haptic. Under Reduce
 *   Motion the flash is skipped; the haptic stays (it does not move).
 * - {@link useLlegada}: the photo shrinking into its place, from 2.4× and
 *   a little above, in 280 ms. Under Reduce Motion it is simply there.
 *
 * The native driver is used off the web, where react-native-web has none.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { impactLight } from '../../haptics/haptics';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

const NATIVE = Platform.OS !== 'web';
const EASE = Easing.bezier(0.2, 0.8, 0.3, 1);

/** The flash's peak opacity, and its two legs in ms (180 in all). */
export const DESTELLO = { pico: 0.85, sube: 40, baja: 140 } as const;
/** The landing: where it starts and how long it takes. */
export const LLEGADA = { escala: 2.4, desde: -120, ms: 280 } as const;

export interface Destello {
  /** The flash layer's opacity, for an absolute white `Animated.View`. */
  readonly opacity: Animated.Value;
  /** The shutter's moment: the haptic, and the flash unless motion is reduced. */
  readonly disparar: () => void;
}

export function useDestello(): Destello {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const disparar = (): void => {
    impactLight();
    if (reduced) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: DESTELLO.pico,
        duration: DESTELLO.sube,
        useNativeDriver: NATIVE,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: DESTELLO.baja,
        easing: EASE,
        useNativeDriver: NATIVE,
      }),
    ]).start();
  };
  return { opacity, disparar };
}

export interface LlegadaStyle {
  readonly transform: readonly (
    | { scale: Animated.AnimatedInterpolation<number> }
    | { translateY: Animated.AnimatedInterpolation<number> }
  )[];
}

/** The photo arriving where it is kept; runs once, on mount. */
export function useLlegada(): LlegadaStyle {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const run = Animated.timing(progress, {
      toValue: 1,
      duration: LLEGADA.ms,
      easing: EASE,
      useNativeDriver: NATIVE,
    });
    run.start();
    return () => run.stop();
  }, [progress, reduced]);
  return {
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [LLEGADA.desde, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [LLEGADA.escala, 1] }) },
    ],
  };
}
