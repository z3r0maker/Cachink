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

import { borders } from '@xangarro/tokens';

export {
  colors,
  type ColorToken,
  fontSizes,
  emojiSizes,
  typography,
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
