/**
 * Minimal Tamagui config for `@cachink/ui`.
 *
 * Tamagui 2.x requires `createTamagui` to be called once before any Tamagui
 * primitive renders. This file provides the minimum viable config so the
 * Phase-0 `<HelloBadge />` component renders in Vitest (jsdom), apps/desktop
 * (Vite), and apps/mobile (Metro + react-native-web) without each of those
 * three targets having to define their own.
 *
 * **Scope intentionally minimal.** The full design-token registration for
 * Phase 1A primitives (Btn, Card, Tag, Modal, Kpi, Gauge, etc.) lands in
 * Phase 1A-M1 alongside the Storybook/Ladle decision. At that point this
 * file grows to encode the brand palette (colors, radii, shadows, typography)
 * into Tamagui's token system so components can reference `$yellow`,
 * `$card`, etc. directly instead of importing from `./theme`.
 *
 * Until Phase 1A: we hand the theme tokens in via `./theme` directly in
 * each component's props, and this config exists solely to satisfy Tamagui's
 * "must-initialize" runtime check.
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
