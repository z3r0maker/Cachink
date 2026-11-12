/**
 * Brand tokens for `@xangarro/ui` — a thin re-export of `@xangarro/tokens`.
 *
 * This file used to be its own copy of the palette, the type ramp and the
 * shape scale. The web moved to `@xangarro/tokens` (P-22, ADR-057) and the
 * copy here went stale: no `yellowRule`, no `borders.quiet`, no `denseRadii`,
 * no portal type scale (M-03, Track M). Every value now comes from the tokens
 * package, which is the web's truth; the exported names stay the same so the
 * `import { colors } from '../theme'` call sites don't change.
 *
 * A new colour, width, radius or shadow goes into `packages/tokens` first
 * (docs/design/el-mostrador.md). Only values that exist because React Native
 * can't read a web token live below, under «native only», and each is derived
 * from a token rather than restated.
 */

import { isWeb } from '@tamagui/core';
import { borders, typography as webTypography } from '@xangarro/tokens';

export {
  colors,
  type ColorToken,
  fontSizes,
  emojiSizes,
  portalFontSizes,
  type FontSize,
  type PortalFontSize,
  radii,
  denseRadii,
  shapeRadii,
  borders,
  shadows,
  pressTransform,
  type Radius,
  breakpoints,
  cajaBreakpoints,
  type BreakpointKey,
  theme,
  type Theme,
} from '@xangarro/tokens';

// ---------------------------------------------------------------------------
// Native only
// ---------------------------------------------------------------------------

type TrackingName = keyof typeof webTypography.letterSpacing;

/** Reads `0.05em` (or `0`) as the number in front, the way iOS's Text did. */
function trackingNumber(css: string): number {
  const match = /^(-?[\d.]+)(em)?$/.exec(css);
  if (!match) throw new Error(`Unexpected letterSpacing token: ${css}`);
  return Number(match[1]);
}

const nativeTracking = {} as Record<TrackingName, number>;
for (const name of Object.keys(webTypography.letterSpacing) as TrackingName[]) {
  nativeTracking[name] = trackingNumber(webTypography.letterSpacing[name]);
}

/** A weight in the type ramp: 400, 500, 600, 700, 800 or 900. */
export type FontWeight = (typeof webTypography.weights)[keyof typeof webTypography.weights];

/**
 * The file `@expo-google-fonts` names each weight after. The family ships
 * 200–800; 900 (`weights.black`) has no file and snaps to 800, exactly as the
 * browser snaps it on the portal.
 */
const FILE_BY_WEIGHT: Readonly<Record<FontWeight, string>> = {
  400: '400Regular',
  500: '500Medium',
  600: '600SemiBold',
  700: '700Bold',
  800: '800ExtraBold',
  900: '800ExtraBold',
};

/** `'Plus Jakarta Sans', sans-serif` → `PlusJakartaSans`: the first family, unquoted, unspaced. */
function familyStem(stack: string): string {
  const first = (stack.split(',')[0] ?? '').trim().replace(/^['"]|['"]$/g, '');
  if (!first) throw new Error(`Unexpected font family token: ${stack}`);
  return first.replace(/\s+/g, '');
}

/**
 * Native only. The name each weight is registered under by `useFonts` in
 * `apps/mobile/src/app/_layout.tsx`: `fontFaces[700]` is
 * `PlusJakartaSans_700Bold`. iOS and Android resolve a font by that name; the
 * CSS stack in the token matches nothing, and the phone fell back to SF and
 * Roboto. Derived from the token, never restated.
 */
export const fontFaces: Readonly<Record<FontWeight, string>> = (() => {
  const stem = familyStem(webTypography.fontFamily);
  const out = {} as Record<FontWeight, string>;
  for (const weight of Object.values(webTypography.weights)) {
    out[weight] = `${stem}_${FILE_BY_WEIGHT[weight]}`;
  }
  return out;
})();

/**
 * Family and weight for a plain React Native `style` (a `TextInput`, a
 * `StyleSheet`), which never reaches Tamagui's `face` map. On the phone a
 * weight is its own file, so this returns that file and no `fontWeight`:
 * Android shows the system font when given both. On the web (Storybook) it
 * returns the CSS stack and the weight.
 */
export function fontFace(weight: FontWeight): { fontFamily: string; fontWeight?: `${FontWeight}` } {
  if (isWeb) return { fontFamily: webTypography.fontFamily, fontWeight: `${weight}` };
  return { fontFamily: fontFaces[weight] };
}

/**
 * Native only. The tokens' `typography` with `letterSpacing` as numbers. The
 * web's are CSS strings (`0.05em`): Android's Text throws on one, and the app
 * could not start; iOS read the number in front and drew 0.05 pt. These keep
 * exactly what iOS drew, so nothing on the iPhone moves.
 *
 * `fontFamily` is the regular file's name on the phone and the CSS stack on
 * the web. Tamagui's font carries a `face` map keyed by weight
 * (`tamagui.config.ts`), so `<Text fontFamily={typography.fontFamily}
 * fontWeight="700">` picks the bold file; text that sets no weight gets the
 * regular one.
 */
export const typography = {
  ...webTypography,
  fontFamily: isWeb ? webTypography.fontFamily : fontFaces[webTypography.weights.regular],
  letterSpacing: nativeTracking as Readonly<Record<TrackingName, number>>,
} as const;

type BorderName = keyof typeof borders;

/** Splits a CSS shorthand like `2px solid #0D0D0D` into its width and colour. */
function parseBorder(shorthand: string): { width: number; color: string } {
  const match = /^([\d.]+)px solid (.+)$/.exec(shorthand);
  if (!match) throw new Error(`Unexpected border token: ${shorthand}`);
  return { width: Number(match[1]), color: match[2] as string };
}

function mapBorders<T>(pick: (b: { width: number; color: string }) => T): Record<BorderName, T> {
  const out = {} as Record<BorderName, T>;
  for (const name of Object.keys(borders) as BorderName[]) {
    out[name] = pick(parseBorder(borders[name]));
  }
  return out;
}

/**
 * Native only. React Native has no `border` shorthand, so the `borders`
 * strings are split into `borderWidth` / `borderColor` props:
 * `borderWidths.thin` is 2, `borderWidths.thick` 2.5, `borderColors.quiet`
 * is `colors.gray200`. Derived from `borders`, never restated.
 */
export const borderWidths: Readonly<Record<BorderName, number>> = mapBorders((b) => b.width);
export const borderColors: Readonly<Record<BorderName, string>> = mapBorders((b) => b.color);

/**
 * Native only. The space and size ramp Tamagui requires in `createTokens`
 * (`$1`…`$8`). The web lays out in its own CSS, so the tokens package has no
 * equivalent.
 */
export const tamaguiSpace = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32 } as const;

/** Native only. Tamagui's `zIndex` token group; the web uses stacking contexts. */
export const tamaguiZIndex = { 1: 0, 2: 10, 3: 100, 4: 1000 } as const;
