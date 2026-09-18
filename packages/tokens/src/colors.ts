/**
 * Xangarro brand tokens — the palette.
 *
 * Extracted from `packages/ui/src/theme.ts` by P-22 (ADR-057) so that the web
 * portal can consume the tokens without pulling in `@xangarro/ui`'s dependency
 * tree. That file is now a re-export of this package; nothing else moved, and
 * no call site changed.
 *
 * Do not add colours, sizes, or shadows outside this package. If a designer
 * proposes a new token, add it here with a comment explaining the use case.
 */

export const colors = {
  // Brand
  yellow: '#FFD60A', // Amarillo Vibrante — hero color
  yellowDeep: '#F5C800',
  yellowSoft: '#FFFBCC',

  // Ink
  black: '#0D0D0D', // All borders, all primary text
  ink: '#1A1A18', // Body text (slightly softer than pure black)
  white: '#FFFFFF',

  // Surfaces
  offwhite: '#F7F7F5', // App background
  gray100: '#F2F2F0',
  gray200: '#E4E4E0',
  gray400: '#9E9E9A', // Fills, dividers, chart series — NOT text (see textMuted)
  gray600: '#5A5A56', // Label text

  // Semantic — surfaces and fills. These are chosen for presence on a
  // background; they are NOT legible as text. Use the *Text pair below
  // whenever the value colours glyphs rather than a shape.
  green: '#00C896',
  greenSoft: '#D6FFF4',
  red: '#FF4757',
  redSoft: '#FFE8EA',
  blue: '#3B6FFF',
  blueSoft: '#E5ECFF',
  warning: '#FFB800',
  warningSoft: '#FFF8E1',

  /*
   * Accessible text tokens.
   *
   * Every value here clears WCAG AA (4.5:1) against *all four* grounds it can
   * land on — white, offwhite, gray100, and its own `*Soft` background — so a
   * caller never has to know which surface it sits on. Each was derived by
   * holding the original token's hue and saturation and darkening only until
   * the worst-case ground passed; that keeps the palette recognisably the
   * same while making it readable.
   *
   * `tests/theme.test.ts` recomputes these ratios on every run. Do not
   * hand-edit a value here without letting that test re-verify it.
   */
  textMuted: '#6F6F6B', // replaces gray400 for secondary text — 4.50:1 worst case
  greenText: '#007E5E', // 4.52:1 worst case
  redText: '#DA0013', // 4.51:1 worst case
  blueText: '#1D59FF', // 4.53:1 worst case
  warningText: '#8E6600', // 4.63:1 worst case

  // Product background (visual categorization)
  purpleSoft: '#F0E5FF',
  peachSoft: '#FFE8D6',

  /*
   * Categorical hues for charts and avatars.
   *
   * The palette had soft tints (`purpleSoft`, `peachSoft`) but no saturated
   * purple or cyan, so chart series and avatar colours reached for raw hexes —
   * and drifted: the avatar cyan was `#06B6D4` while the chart cyan was
   * `#0EA5E9`, two different colours for the same role. Named here so the next
   * series that needs a hue finds one. Audit 2026-09.
   */
  purple: '#8B5CF6',
  cyan: '#06B6D4',

  /**
   * Scrim behind modals, sheets, and dropdowns.
   *
   * The only non-hex value in the palette, because a backdrop must let the
   * surface below show through. Four components previously hardcoded this at
   * three different alphas (0.35 / 0.45 / 0.5); one token, one weight.
   */
  scrim: 'rgba(13, 13, 13, 0.45)',
} as const;

export type ColorToken = keyof typeof colors;
