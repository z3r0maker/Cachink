import { style, styleVariants } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/**
 * Segmented tab bar — one bordered container, tabs divided by a 2.5 px rule.
 *
 * Deliberately **not** folder tabs (design handoff, Estados financieros). The
 * active tab fills yellow and its count pill turns white.
 */
export const tabList = style({
  display: 'inline-flex',
  // `inline-flex` shrink-wraps in normal flow, but a flex column stretches its
  // items: the bar then ran the width of the page and the last tab stopped
  // short of the right border, leaving a white sliver inside it. Both lines
  // are needed — `alignSelf` for flex parents, `width` for grid ones.
  alignSelf: 'flex-start',
  width: 'fit-content',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.white,
  boxShadow: shadows.card,
  overflow: 'hidden',
  maxWidth: '100%',
});

export const tabItem = style([
  pressable,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    height: 52,
    padding: '0 24px',
    border: 0,
    background: colors.white,
    color: colors.black,
    fontFamily: typography.fontFamily,
    fontSize: fontSizes.md,
    fontWeight: typography.weights.extraBold,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    boxShadow: 'none',
    selectors: {
      '&:not(:first-child)': { borderLeft: `2.5px solid ${colors.black}` },
      '&[data-state="active"]': { background: colors.yellow },
      '&:active:not(:disabled)': { transform: 'none', boxShadow: 'none' },
    },
  },
]);

export const countPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 26,
  padding: '1px 8px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const countPillState = styleVariants({
  active: { background: colors.white },
  inactive: { background: colors.gray100 },
});

/** The period / range chip row. Selected chips carry the small hard shadow. */
export const chip = style([
  pressable,
  {
    height: 40,
    padding: '0 14px',
    background: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    boxShadow: 'none',
    fontFamily: typography.fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
    whiteSpace: 'nowrap',
    selectors: {
      '&[data-selected="true"]': { background: colors.yellow, boxShadow: shadows.small },
    },
  },
]);
