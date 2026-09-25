/**
 * Xangarro brand tokens — shape, borders, shadows and the press interaction.
 *
 * Extracted from `packages/ui/src/theme.ts` by P-22 (ADR-057) so that the web
 * portal can consume the tokens without pulling in `@xangarro/ui`'s dependency
 * tree. That file is now a re-export of this package; nothing else moved, and
 * no call site changed.
 *
 * Do not add colours, sizes, or shadows outside this package. If a designer
 * proposes a new token, add it here with a comment explaining the use case.
 */

import { colors } from './colors.js';

/**
 * Border radii follow a strict scale. Per CLAUDE.md §8.3, we use the scale,
 * never invent values.
 */
export const radii = [8, 10, 12, 14, 16, 18, 20, 22] as const;
export type Radius = (typeof radii)[number];

/**
 * The two dense steps the operator handoff adds to the scale (ADR-076): 11 for
 * 40–42px icon boxes and quantity steppers, 13 for 52px buttons, keypad keys
 * and inputs. Kept out of `radii` because ~80 call sites index that array;
 * inserting would silently re-round every one of them.
 */
export const denseRadii = { r11: 11, r13: 13 } as const;

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
 * Borders are always 2 or 2.5 px solid. Black by default; the one quiet
 * exception is ADR-107's: a 2 px gray200 edge for surfaces you read but do not
 * press (El Mostrador), so black stays the sign of "you can act on this".
 * No other widths. No dashed.
 */
export const borders = {
  thin: `2px solid ${colors.black}`,
  thick: `2.5px solid ${colors.black}`,
  quiet: `2px solid ${colors.gray200}`,
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
