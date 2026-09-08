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
import { motionDuration, useReducedMotion } from '../../hooks/use-reduced-motion';
import { colors, fontSizes, shapeRadii, typography } from '../../theme';

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
    rays: useRef(
      Array.from({ length: RAY_COUNT }, () => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
      })),
    ).current,
  };
}

function buildPopSequence(scale: Animated.Value, opacity: Animated.Value, reduced: boolean) {
  const easing = Easing.bezier(0.2, 0.8, 0.2, 1);
  // Under reduced motion the badge crossfades at full size instead of
  // overshooting to 1.15 — the confirmation still reads, the lurch doesn't.
  const overshoot = reduced ? 1 : 1.15;
  return Animated.sequence([
    // Pop in: 0 → 1.15 (overshoot)
    Animated.parallel([
      Animated.timing(scale, {
        toValue: overshoot,
        duration: motionDuration(300, reduced),
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]),
    // Settle: 1.15 → 1
    Animated.timing(scale, {
      toValue: 1,
      duration: motionDuration(150, reduced),
      easing,
      useNativeDriver: true,
    }),
    // Hold
    Animated.delay(100),
    // Fade out
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
  ]);
}

function buildRayAnimation(
  ray: { opacity: Animated.Value; translateY: Animated.Value },
  reduced: boolean,
) {
  return Animated.parallel([
    Animated.sequence([
      Animated.timing(ray.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(ray.opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]),
    Animated.timing(ray.translateY, {
      // Rays travel 80pt upward; under reduced motion they stay put and only
      // fade, which is the crossfade alternative WCAG 2.3.3 asks for.
      toValue: reduced ? 0 : -80,
      duration: motionDuration(600, reduced),
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }),
  ]);
}

function BurstRay({
  index,
  anim,
}: {
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
          transform: [{ rotate: `${angle}deg` }, { translateY: anim.translateY }],
        },
      ]}
    />
  );
}

function useBurstAnimation(visible: boolean, onComplete: () => void) {
  const anim = useAnimationValues();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!visible) return;

    anim.badgeScale.setValue(0.3);
    anim.badgeOpacity.setValue(0);
    for (const ray of anim.rays) {
      ray.opacity.setValue(0);
      ray.translateY.setValue(reduced ? 0 : -10);
    }

    const rayAnims = anim.rays.map((ray, i) =>
      Animated.sequence([Animated.delay(i * RAY_STAGGER_MS), buildRayAnimation(ray, reduced)]),
    );

    const masterAnimation = Animated.parallel([
      buildPopSequence(anim.badgeScale, anim.badgeOpacity, reduced),
      ...rayAnims,
    ]);

    masterAnimation.start(() => onComplete());
    return () => masterAnimation.stop();
  }, [visible, anim, onComplete, reduced]);

  return anim;
}

function BadgeLabel(): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={fontSizes.xl5}
      color={colors.black}
      letterSpacing={typography.letterSpacing.tightest}
      userSelect="none"
    >
      ¡CACHINK!
    </Text>
  );
}

function AnimatedBadge({
  scale,
  opacity,
}: {
  scale: Animated.Value;
  opacity: Animated.Value;
}): ReactElement {
  return (
    <Animated.View style={[styles.badge, { opacity, transform: [{ scale }, { rotate: '-6deg' }] }]}>
      <BadgeLabel />
    </Animated.View>
  );
}

export function CachinkBurst({
  visible,
  onComplete,
  testID,
}: CachinkBurstProps): ReactElement | null {
  const anim = useBurstAnimation(visible, onComplete);

  if (!visible) return null;

  return (
    <View testID={testID ?? 'cachink-burst'} style={styles.overlay} pointerEvents="none">
      {anim.rays.map((ray, i) => (
        <BurstRay key={i} index={i} anim={ray} />
      ))}
      <AnimatedBadge scale={anim.badgeScale} opacity={anim.badgeOpacity} />
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
    borderWidth: 2.5,
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
    borderRadius: shapeRadii.mark,
  },
});
