/**
 * CachinkBurst — neobrutalist "¡CACHINK!" celebration overlay.
 *
 * Fires exclusively when a new sale (venta) is registered. Shows a yellow
 * badge with burst rays that pops in and fades out in ~900ms.
 *
 * Animation ported from CachinkLanding/landing/AnimatedHero.jsx (CSS
 * @keyframes cachinkPop + rayShoot) to React Native `Animated` with
 * `useNativeDriver: true`. Same easing, same timing, same visual output.
 */

import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@tamagui/core';
import { colors, typography } from '../../theme';

const RAY_COUNT = 8;
const RAY_STAGGER_MS = 20;

export interface CachinkBurstProps {
  /** When true, plays the animation once then calls onComplete. */
  readonly visible: boolean;
  /** Called after the animation finishes (~900ms). */
  readonly onComplete: () => void;
  readonly testID?: string;
}

function useAnimationValues() {
  return {
    badgeScale: useRef(new Animated.Value(0)).current,
    badgeOpacity: useRef(new Animated.Value(0)).current,
    rays: useRef(Array.from({ length: RAY_COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))).current,
  };
}

function buildPopSequence(scale: Animated.Value, opacity: Animated.Value) {
  const easing = Easing.bezier(0.2, 0.8, 0.2, 1);
  return Animated.sequence([
    // Pop in: 0 → 1.15 (overshoot)
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.15, duration: 300, easing, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]),
    // Settle: 1.15 → 1
    Animated.timing(scale, { toValue: 1, duration: 150, easing, useNativeDriver: true }),
    // Hold
    Animated.delay(100),
    // Fade out
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
  ]);
}

function buildRayAnimation(ray: { opacity: Animated.Value; translateY: Animated.Value }) {
  return Animated.parallel([
    Animated.sequence([
      Animated.timing(ray.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(ray.opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]),
    Animated.timing(ray.translateY, {
      toValue: -80,
      duration: 600,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }),
  ]);
}

function BurstRay({ index, anim }: {
  index: number;
  anim: { opacity: Animated.Value; translateY: Animated.Value };
}): ReactElement {
  const angle = index * 45;
  return (
    <Animated.View
      style={[
        styles.ray,
        {
          opacity: anim.opacity,
          transform: [
            { rotate: `${angle}deg` },
            { translateY: anim.translateY },
          ],
        },
      ]}
    />
  );
}

export function CachinkBurst({ visible, onComplete, testID }: CachinkBurstProps): ReactElement | null {
  const anim = useAnimationValues();

  useEffect(() => {
    if (!visible) return;

    // Reset all values
    anim.badgeScale.setValue(0.3);
    anim.badgeOpacity.setValue(0);
    for (const ray of anim.rays) {
      ray.opacity.setValue(0);
      ray.translateY.setValue(-10);
    }

    // Build ray animations with stagger
    const rayAnims = anim.rays.map((ray, i) =>
      Animated.sequence([
        Animated.delay(i * RAY_STAGGER_MS),
        buildRayAnimation(ray),
      ]),
    );

    const masterAnimation = Animated.parallel([
      buildPopSequence(anim.badgeScale, anim.badgeOpacity),
      ...rayAnims,
    ]);

    masterAnimation.start(() => onComplete());

    return () => masterAnimation.stop();
  }, [visible, anim, onComplete]);

  if (!visible) return null;

  return (
    <View testID={testID ?? 'cachink-burst'} style={styles.overlay} pointerEvents="none">
      {/* Burst rays */}
      {anim.rays.map((ray, i) => (
        <BurstRay key={i} index={i} anim={ray} />
      ))}

      {/* Yellow badge */}
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: anim.badgeOpacity,
            transform: [
              { scale: anim.badgeScale },
              { rotate: '-6deg' },
            ],
          },
        ]}
      >
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={32}
          color={colors.black}
          letterSpacing={typography.letterSpacing.tightest}
          userSelect="none"
        >
          ¡CACHINK!
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  ray: {
    position: 'absolute',
    width: 3,
    height: 28,
    backgroundColor: colors.black,
    borderRadius: 2,
  },
});
