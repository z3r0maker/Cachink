/**
 * FloatingCoinsBackground — animated Lucide-icon particles behind gate
 * screens (Wizard, BusinessForm, RolePicker).
 *
 * Single-loop sine interpolation on 3 unsynchronized axes (Y float, X sway,
 * Z rotation) produces organic Lissajous-like drift. A continuous linear
 * timing loop drives each axis; the native driver evaluates sine-sampled
 * interpolation curves on the UI thread — zero JS bridge overhead per frame.
 *
 * Asymmetric amplitude removes any obvious oscillation center. 36 particles ×
 * 7 Lucide icon variants × uniform opacity (0.30) = dense but atmospheric.
 */

import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { Icon } from '../Icon';
import type { IconName } from '../Icon/icon.shared';

const IS_E2E = process.env.EXPO_PUBLIC_E2E === '1';
const PARTICLE_COUNT = 36;
const SINE_SAMPLES = 20;

/** Finance-themed Lucide icon palette for background particles. */
const FLOATING_ICONS: readonly IconName[] = [
  'dollar-sign', // clean $ glyph (replaces broken SignIcon)
  'banknote', // paper bill
  'wallet', // wallet (replaces crude WalletIcon)
  'coins', // coin stack
  'hand-coins', // hand giving coins
  'trending-up', // upward trend (replaces ugly RisingArrow)
  'credit-card', // payment card
] as const;

interface ParticleConfig {
  readonly id: number;
  readonly iconIndex: number;
  readonly top: number;
  readonly left: number;
  readonly size: number;
  readonly opacity: number;
  readonly floatDur: number;
  readonly floatDist: number;
  readonly swayDur: number;
  readonly swayDist: number;
  readonly rotateDur: number;
  readonly rotateAmp: number;
  readonly delay: number;
  readonly asymmetry: number;
}

/** Deterministic-seeded pseudo-random using index as seed. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/** Map a seeded random [0,1) to range [min, max). */
function randRange(seed: number, min: number, max: number): number {
  return seededRandom(seed) * (max - min) + min;
}

/**
 * Generates an interpolation config that maps a linear [0→1] input to a
 * smooth sine wave with asymmetric amplitude. Uses 20 sample points for
 * high-fidelity native-side interpolation — no sequence transitions needed.
 */
function buildSineInterpolation(
  amplitude: number,
  asymmetry: number,
): { inputRange: number[]; outputRange: number[] } {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= SINE_SAMPLES; i++) {
    const t = i / SINE_SAMPLES;
    inputRange.push(t);
    const raw = Math.sin(t * 2 * Math.PI);
    const scaled = raw >= 0 ? raw * amplitude * asymmetry : raw * amplitude * (2 - asymmetry);
    outputRange.push(scaled);
  }
  return { inputRange, outputRange };
}

/**
 * Creates a single continuous linear animation loop (0→1).
 * The native driver evaluates interpolation curves on the UI thread —
 * no JS bridge overhead per frame, no sequence boundary hitches.
 */
function makeSmoothLoop(anim: Animated.Value, duration: number): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );
}

/** Threshold: particles within 40% of center get faded. */
const CENTER_FADE_THRESHOLD = 0.4;
const CENTER_OPACITY = 0.12;
const EDGE_OPACITY = 0.3;

function generateParticles(): readonly ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const base = i * 11;
    const top = randRange(base + 2, 2, 92);
    const left = randRange(base + 3, 5, 90);
    // Distance from center (50%, 50%) normalized to [0, 1]
    const dx = (top - 50) / 50;
    const dy = (left - 50) / 50;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const opacity = distFromCenter < CENTER_FADE_THRESHOLD ? CENTER_OPACITY : EDGE_OPACITY;
    particles.push({
      id: i,
      iconIndex: Math.floor(randRange(base + 1, 0, FLOATING_ICONS.length)),
      top,
      left,
      size: Math.round(randRange(base + 4, 24, 52)),
      opacity,
      floatDur: Math.round(randRange(base + 6, 6000, 12000)),
      floatDist: Math.round(randRange(base + 7, 10, 22)),
      swayDur: Math.round(randRange(base + 8, 7500, 15000)),
      swayDist: Math.round(randRange(base + 9, 6, 16)),
      rotateDur: Math.round(randRange(base + 10, 9000, 18000)),
      rotateAmp: Math.round(randRange(base + 11, 6, 14)),
      delay: Math.round(randRange(base + 12, 0, 3000)),
      asymmetry: randRange(base + 13, 0.6, 1.4),
    });
  }
  return particles;
}

const PARTICLES = generateParticles();

interface AnimValues {
  readonly float: Animated.Value;
  readonly sway: Animated.Value;
  readonly rotate: Animated.Value;
}

function useParticleAnimation(config: ParticleConfig): AnimValues {
  const float = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = makeSmoothLoop(float, config.floatDur);
    const swayLoop = makeSmoothLoop(sway, config.swayDur);
    const rotateLoop = makeSmoothLoop(rotate, config.rotateDur);

    const timeout = setTimeout(() => {
      floatLoop.start();
      swayLoop.start();
      rotateLoop.start();
    }, config.delay);

    return () => {
      clearTimeout(timeout);
      floatLoop.stop();
      swayLoop.stop();
      rotateLoop.stop();
    };
  }, [float, sway, rotate, config]);

  return { float, sway, rotate };
}

/** Builds interpolated animated values for all 3 particle axes. */
function useParticleTransforms(
  config: ParticleConfig,
  anims: AnimValues,
): {
  floatY: Animated.AnimatedInterpolation<number>;
  swayX: Animated.AnimatedInterpolation<number>;
  rotateDeg: Animated.AnimatedInterpolation<string>;
} {
  const floatInterp = buildSineInterpolation(config.floatDist, config.asymmetry);
  const swayInterp = buildSineInterpolation(config.swayDist, config.asymmetry);
  const rotateInterp = buildSineInterpolation(config.rotateAmp, 1);

  return {
    floatY: anims.float.interpolate(floatInterp),
    swayX: anims.sway.interpolate(swayInterp),
    rotateDeg: anims.rotate.interpolate({
      inputRange: rotateInterp.inputRange,
      outputRange: rotateInterp.outputRange.map((v) => `${v}deg`),
    }),
  };
}

function MoneyParticle({ config }: { config: ParticleConfig }): ReactElement {
  const anims = useParticleAnimation(config);
  const iconName: IconName =
    FLOATING_ICONS[config.iconIndex % FLOATING_ICONS.length] ?? 'dollar-sign';
  const { floatY, swayX, rotateDeg } = useParticleTransforms(config, anims);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: `${config.top}%`,
        left: `${config.left}%`,
        opacity: config.opacity,
        transform: [{ translateY: floatY }, { translateX: swayX }, { rotate: rotateDeg }],
      }}
    >
      <Icon name={iconName} size={config.size} color={colors.yellowDeep} strokeWidth={2.5} />
    </Animated.View>
  );
}

export interface FloatingCoinsBackgroundProps {
  readonly children: ReactNode;
  readonly testID?: string;
}

export function FloatingCoinsBackground({
  children,
  testID,
}: FloatingCoinsBackgroundProps): ReactElement {
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.offwhite }]}>
      {!IS_E2E && (
        <View testID="floating-coins-layer" style={styles.coinLayer}>
          {PARTICLES.map((p) => (
            <MoneyParticle key={p.id} config={p} />
          ))}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  coinLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  } as const,
});
