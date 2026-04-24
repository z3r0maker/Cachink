/**
 * Tamagui config for `@cachink/ui`.
 *
 * Tamagui 2.x requires `createTamagui` to be called once before any Tamagui
 * primitive renders. This file registers the full brand palette (all 18
 * colors from `./theme`), the strict radii scale, and a minimal size/space
 * ramp so Phase 1A primitives (Btn, Card, Tag, Modal, Kpi, Gauge, etc.) can
 * reference `$yellow`, `$black`, `$green`, `$red`, etc. as design tokens.
 *
 * Shadows and the press-transform are NOT expressed as Tamagui tokens —
 * they come from `./theme`'s `shadows` / `pressTransform` constants because
 * they're hard-drop-shadow strings, not color ramps Tamagui can interpolate.
 * Components import the shadow constants directly; see `Btn/btn.tsx` for the
 * canonical example.
 */

import { createFont, createTamagui, createTokens } from '@tamagui/core';
import { colors, radii } from './theme';

const plusJakartaSans = createFont({
  family: "'Plus Jakarta Sans', sans-serif",
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 28, 8: 32 },
  lineHeight: { 1: 16, 2: 20, 3: 24, 4: 28, 5: 32, 6: 36, 7: 40, 8: 44 },
  weight: { 4: '400', 5: '500', 7: '700', 9: '900' },
  letterSpacing: { 4: 0, 5: 0, 7: -0.25, 9: -0.5 },
});

const tokens = createTokens({
  color: colors,
  // Tamagui requires at least these four token groups to be present for
  // `createTamagui` to accept the config. Use the brand radii scale for
  // `radius` and `size`; `space` and `zIndex` get trivial ramps.
  radius: {
    1: radii[0],
    2: radii[1],
    3: radii[2],
    4: radii[3],
    5: radii[4],
    6: radii[5],
    7: radii[6],
    8: radii[7],
  },
  size: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32 },
  zIndex: { 1: 0, 2: 10, 3: 100, 4: 1000 },
});

export const tamaguiConfig = createTamagui({
  fonts: { heading: plusJakartaSans, body: plusJakartaSans },
  tokens,
  themes: {
    light: {
      background: colors.offwhite,
      color: colors.ink,
      borderColor: colors.black,
    },
  },
  // Default font reference so `<Text>` without explicit font has something.
  defaultFont: 'body',
  settings: {
    // Avoid Tamagui's animation-driver import path in environments without
    // react-native-web — Phase 1A re-enables a proper driver.
    disableSSR: true,
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;

// Augment Tamagui's module so downstream consumers get our typed config.
declare module '@tamagui/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
