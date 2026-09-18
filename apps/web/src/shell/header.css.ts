import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/** Matches the sidebar's brand block exactly so the borders form one line. */
export const HEIGHT = 76;
/** The content cap, shared with `main` so header and content align. */
export const MAX_WIDTH = 1760;

export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 30,
  height: HEIGHT,
  boxSizing: 'border-box',
  padding: '0 32px',
  background: colors.gray200,
  borderBottom: `2.5px solid ${colors.black}`,
});

export const inner = style({
  maxWidth: MAX_WIDTH,
  height: '100%',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

export const switcher = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '6px 12px',
    background: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.small,
    textAlign: 'left',
  },
]);

export const initialsTile = style({
  width: 30,
  height: 30,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  background: colors.yellow,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const bizName = style({
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  lineHeight: 1.15,
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const roleLabel = style({
  marginTop: 1,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const right = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
});

export const bell = style([
  pressable,
  {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: 44,
    height: 44,
    flex: 'none',
    background: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.small,
    color: colors.black,
    textDecoration: 'none',
  },
]);

export const badge = style({
  position: 'absolute',
  top: -7,
  right: -7,
  minWidth: 22,
  height: 22,
  padding: '0 5px',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  background: colors.yellow,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

/**
 * The avatar's hit area.
 *
 * The handoff draws the avatar at 34×34, but condition 8 of the réplica
 * requires 44 px targets. Both hold: the **mark** stays 34 px and the
 * **button** is padded out to 44 px, so nothing moves visually and the target
 * is reachable with a thumb. axe caught this at the tablet breakpoint.
 */
export const avatarHit = style([
  pressable,
  {
    width: 44,
    height: 44,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    background: 'transparent',
    border: 0,
    boxShadow: 'none',
  },
]);

export const avatar = style([
  {
    width: 34,
    height: 34,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    background: colors.blueSoft,
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    boxShadow: shadows.small,
    fontSize: fontSizes.sm,
    fontWeight: typography.weights.extraBold,
    color: colors.blueText,
  },
]);
