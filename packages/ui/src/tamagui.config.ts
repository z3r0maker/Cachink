/**
 * Tamagui config for `@xangarro/ui`.
 *
 * Tamagui 2.x requires `createTamagui` to be called once before any Tamagui
 * primitive renders. Every value here comes from `./theme`, which re-exports
 * `@xangarro/tokens` (M-03): the palette (so `$yellow`, `$yellowRule`,
 * `$gray200` exist as colour tokens), the radius ladder plus the dense and
 * shape radii, and the font family, sizes and weights. Only the space, size
 * and zIndex ramps are native-only, and they also live in `./theme`.
 *
 * Shadows and the press-transform are NOT expressed as Tamagui tokens —
 * they come from `./theme`'s `shadows` / `pressTransform` constants because
 * they're hard-drop-shadow strings, not color ramps Tamagui can interpolate.
 * Components import the shadow constants directly; see `Btn/btn.tsx` for the
 * canonical example.
 */

import { createFont, createTamagui, createTokens } from '@tamagui/core';
import {
  breakpoints,
  colors,
  denseRadii,
  fontSizes,
  radii,
  shapeRadii,
  tamaguiSpace,
  tamaguiZIndex,
  typography,
} from './theme';

/*
 * Font tokens `$1`…`$8` keep their old values (12 → 32) but are now read off
 * the shared type ramp. Nothing calls them yet; El Mostrador screens (M-05+)
 * pass `fontSizes` / `portalFontSizes` directly.
 */
const fontSize = {
  1: fontSizes.xs,
  2: fontSizes.md,
  3: fontSizes.lg,
  4: fontSizes.xl,
  5: fontSizes.xl2,
  6: fontSizes.xl3,
  7: fontSizes.xl4,
  8: fontSizes.xl5,
} as const;

const { weights } = typography;

const plusJakartaSans = createFont({
  family: typography.fontFamily,
  size: fontSize,
  lineHeight: { 1: 16, 2: 20, 3: 24, 4: 28, 5: 32, 6: 36, 7: 40, 8: 44 },
  weight: {
    4: String(weights.regular),
    5: String(weights.medium),
    6: String(weights.semibold),
    7: String(weights.bold),
    8: String(weights.extraBold),
    9: String(weights.black),
  },
  letterSpacing: { 4: 0, 5: 0, 7: -0.25, 9: -0.5 },
});

const tokens = createTokens({
  color: colors,
  // `$1`…`$8` walk the card ladder (8 → 22); `$r11` / `$r13` are the dense
  // radii of El Mostrador's rows and chips; `$mark`, `$markLg`, `$pill` the
  // off-ladder shapes.
  radius: {
    1: radii[0],
    2: radii[1],
    3: radii[2],
    4: radii[3],
    5: radii[4],
    6: radii[5],
    7: radii[6],
    8: radii[7],
    ...denseRadii,
    ...shapeRadii,
  },
  size: tamaguiSpace,
  space: tamaguiSpace,
  zIndex: tamaguiZIndex,
});

/**
 * Media queries — consumed by `useMedia()` in component code.
 *
 * Keys map 1:1 onto the `breakpoints` scale in `./theme`. Each entry is a
 * width-range query expressed in pixels:
 *
 *   - `sm`   → `maxWidth: gtSm - 1` (width <= 480)            → phone portrait
 *   - `gtSm` → `minWidth: gtSm`     (width >= 481)            → phone landscape +
 *   - `gtMd` → `minWidth: gtMd`     (width >= 769)            → tablet landscape +
 *   - `gtLg` → `minWidth: gtLg`     (width >= 1281)           → wide desktop
 *
 * Usage example (see `packages/ui/src/responsive/README.md` for the full
 * contract):
 *
 *   const media = useMedia();
 *   if (media.gtMd) return <SplitPane left={...} right={...} />;
 *   return <Stack>{...}</Stack>;
 *
 * The `gt*` ("greater-than") keys form a cumulative ladder — at 1500 px
 * `gtSm`, `gtMd`, and `gtLg` are all `true`. Components decide on the
 * highest-applicable key, not on exact ranges.
 */
const media = {
  sm: { maxWidth: breakpoints.gtSm - 1 },
  gtSm: { minWidth: breakpoints.gtSm },
  gtMd: { minWidth: breakpoints.gtMd },
  gtLg: { minWidth: breakpoints.gtLg },
} as const;

export const tamaguiConfig = createTamagui({
  fonts: { heading: plusJakartaSans, body: plusJakartaSans },
  tokens,
  themes: {
    light: {
      background: colors.offwhite,
      color: colors.ink,
      borderColor: colors.black,
      /*
       * Placeholder ink, exposed as the `$placeholderColor` theme token.
       *
       * Tamagui's `placeholderTextColor` prop accepts a theme token, not a raw
       * value, so the fields were reaching for Tamagui's built-in `$gray400` —
       * a colour outside this palette that measures 2.4:1 on every Xangarro
       * surface and fails WCAG AA. Naming it here lets the fields ask for the
       * brand's accessible muted ink instead. Audit 2026-09.
       */
      placeholderColor: colors.textMuted,
    },
  },
  media,
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
