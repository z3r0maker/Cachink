/**
 * Cachink brand tokens — the neobrutalist-yellow visual DNA.
 *
 * All values are encoded exactly from CLAUDE.md §8. This file is the single
 * source of truth for colors, typography, shape, and shadow scales. Tamagui's
 * theme config (to be added in Phase 1A) consumes these constants, and any
 * future platform-specific rendering (e.g. Tauri-only web CSS) imports the
 * same values.
 *
 * Do not add colors, sizes, or shadows outside this file. If a designer
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
 * Border radii follow a strict scale. Per CLAUDE.md §8.3, we use the scale,
 * never invent values.
 */
export const radii = [8, 10, 12, 14, 16, 18, 20, 22] as const;
export type Radius = (typeof radii)[number];

/**
 * Radii the card ladder above was never meant to cover.
 *
 * `radii` describes cards, buttons, and sheets. It says nothing about a 2px
 * chart-bar corner or an 18px circular badge, so those reached for literals —
 * and the audit flagged twenty of them as "off-scale" when they were really
 * *off-ladder*: a different kind of shape, not a broken value.
 *
 * `pill` is deliberately larger than any element that uses it. Both React
 * Native and CSS clamp a border radius to half the shorter side, so one value
 * yields a circle on a square badge and a capsule on a wide toggle, without
 * every call site restating `size / 2`. Audit 2026-09.
 */
export const shapeRadii = {
  /** Data-viz marks: chart bars, sparkline caps, thin segments. */
  mark: 2,
  /** Larger data-viz marks and inline chips. */
  markLg: 4,
  /** Fully rounded: circular badges, capsule toggles, pills. */
  pill: 9999,
} as const;

/**
 * Borders are always 2 or 2.5 px solid black per CLAUDE.md §8.3. No other
 * widths. No dashed. No other colors.
 */
export const borders = {
  thin: `2px solid ${colors.black}`,
  thick: `2.5px solid ${colors.black}`,
} as const;

/**
 * Shadows are HARD drop shadows only. No blur, no rgba, no soft shadows.
 * See CLAUDE.md §8.3.
 */
export const shadows = {
  small: `3px 3px 0 ${colors.black}`,
  card: `4px 4px 0 ${colors.black}`,
  hero: `5px 5px 0 ${colors.black}`,
  /** Press state — the tactile feel described in §8.3. */
  pressed: `1px 1px 0 ${colors.black}`,
} as const;

/**
 * The signature press-down interaction. Apply to buttons and tappable cards.
 * Desktop hover may additionally lift the element; on press the element
 * shifts and the shadow shrinks, giving the "stamp" feel.
 */
export const pressTransform = {
  from: 'translate(0, 0)',
  to: 'translate(2px, 2px)',
  shadowFrom: shadows.small,
  shadowTo: shadows.pressed,
  durationMs: 100,
} as const;

/**
 * Responsive breakpoints (audit M-1 PR 5.5-T01 / B1).
 *
 * Cachink ships on phones, tablets (the primary form factor — see CLAUDE.md
 * §1), and desktops. The breakpoint scale below maps Tamagui's `useMedia()`
 * keys onto the iOS / iPad / Android / desktop form-factor matrix. A
 * breakpoint key is the **minimum** parent-width threshold for which the
 * media key is active.
 *
 * Form-factor matrix (px width):
 * | Range      | Key        | Form factor                                  |
 * |------------|------------|----------------------------------------------|
 * |   0 –  480 | `sm`       | Phone portrait (iPhone, small Android)      |
 * | 481 –  768 | `gtSm`     | Phone landscape, small tablet portrait      |
 * | 769 – 1280 | `gtMd`     | Tablet landscape, iPad Pro 11", desktop     |
 * | 1281+      | `gtLg`     | Wide desktop, iPad Pro 12.9" landscape       |
 *
 * The `gt*` ("greater-than") prefix mirrors Tamagui's convention: `gtMd` is
 * "greater than the medium breakpoint", i.e. tablet landscape and up. Use
 * this for split-pane mounts (`<SplitPane>` only renders side-by-side at
 * `gtMd`+) and for switching the Director Home grid between 1/2/3 columns.
 *
 * **Rule of thumb:** prefer `gtMd` for "tablet-landscape and bigger"
 * decisions. Use `sm` (and only `sm`) for phone-portrait fallbacks. The
 * other two keys exist for symmetry with Tamagui's media-config requirement
 * — most Phase 1 surfaces won't need them.
 *
 * The `breakpoints` object is consumed by `tamagui.config.ts`'s `media`
 * setting; nothing else should re-derive these numbers.
 */
export const breakpoints = {
  sm: 0,
  gtSm: 481,
  gtMd: 769,
  gtLg: 1281,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

export const theme = {
  colors,
  typography,
  radii,
  borders,
  shadows,
  pressTransform,
  breakpoints,
} as const;

export type Theme = typeof theme;
