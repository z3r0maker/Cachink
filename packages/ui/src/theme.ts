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
  gray400: '#9E9E9A', // Secondary text
  gray600: '#5A5A56', // Label text

  // Semantic
  green: '#00C896',
  greenSoft: '#D6FFF4',
  red: '#FF4757',
  redSoft: '#FFE8EA',
  blue: '#3B6FFF',
  blueSoft: '#E5ECFF',
  warning: '#FFB800',
  warningSoft: '#FFF8E1',
} as const;

export type ColorToken = keyof typeof colors;

export const typography = {
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
