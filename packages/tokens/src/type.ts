/**
 * Xangarro brand tokens — the type ramp.
 *
 * Extracted from `packages/ui/src/theme.ts` by P-22 (ADR-057) so that the web
 * portal can consume the tokens without pulling in `@xangarro/ui`'s dependency
 * tree. That file is now a re-export of this package; nothing else moved, and
 * no call site changed.
 *
 * Do not add colours, sizes, or shadows outside this package. If a designer
 * proposes a new token, add it here with a comment explaining the use case.
 */

/**
 * The type ramp.
 *
 * This file's own docblock has always said "do not add colors, sizes, or
 * shadows outside this file" — but a size scale was never defined, so 488
 * `fontSize` literals accumulated across 18 distinct values from 9px to 56px.
 * These eleven steps are that missing scale, derived from the sizes actually
 * in use rather than invented: each absorbs the strays nearest to it.
 *
 * Named by magnitude, not by role. The scale was applied by snapping existing
 * values, so calling `18` a "title" would assert a semantic the codemod never
 * checked. Pick the step that looks right; the name makes no claim.
 *
 * **`xs` is 12, and that is the floor.** 61 call sites previously sat at 9-11px,
 * which is below the practical minimum for sustained reading — and Cachink is
 * used at arm's length on a counter, often by older shopkeepers. Nothing in the
 * product needs to be smaller than this.
 */
export const fontSizes = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xl2: 20,
  xl3: 24,
  xl4: 28,
  xl5: 32,
  xl6: 36,
  xl7: 48,
} as const;

/**
 * Emoji rendered as illustration, not as text.
 *
 * `<Text fontSize={56}>🎉</Text>` is a picture that happens to be a glyph: it
 * carries no words, sets no measure, and must not be dragged along when the
 * type ramp changes. Kept separate so it can never be snapped onto `sizes`.
 */
export const emojiSizes = {
  md: 40,
  lg: 56,
} as const;

export type FontSize = (typeof fontSizes)[keyof typeof fontSizes];

export const typography = {
  /** Alias of the exported `fontSizes`. Prefer importing `fontSizes` directly:
   *  `fontSize={fontSizes.md}` fits the 100-column print width where
   *  `fontSize={typography.sizes.md}` does not, and prettier exploding those
   *  lines pushed a dozen components past the §2.6 40-line function budget. */
  sizes: fontSizes,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
  },
  letterSpacing: {
    tightest: '-0.04em',
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    wider: '0.07em',
    widest: '0.08em',
  },
} as const;

/**
 * The **portal's** type scale.
 *
 * The web surface needs display steps the phone never had. The design handoff
 * lists them explicitly — 56 (hero figure), 44, 40, 36 (page title and KPI
 * figure), 34, 30, 26, 24, 22, 20 (card title), 19, 17, 16, 15 (body and
 * table), 14, 13, 12 — and seven of those are absent from `fontSizes`, which
 * was derived from the sizes the mobile app actually used.
 *
 * Kept as its own scale rather than merged, because the two surfaces have
 * genuinely different ranges: a 56 px figure is right on a 1760 px dashboard
 * and wrong on a phone. `fontSizes` stays the mobile ramp and the floor of 12
 * holds for both — Xangarro is read at arm's length on a counter.
 */
export const portalFontSizes = {
  xs: 12,
  sm: 13,
  md: 14,
  body: 15,
  lg: 16,
  lgx: 17,
  xl: 19,
  cardTitle: 20,
  xl2: 22,
  xl3: 24,
  xl4: 26,
  xl5: 30,
  xl6: 34,
  pageTitle: 36,
  display: 40,
  displayLg: 44,
  /** The Suscripción price figure. */
  price: 52,
  hero: 56,
} as const;

export type PortalFontSize = (typeof portalFontSizes)[keyof typeof portalFontSizes];
