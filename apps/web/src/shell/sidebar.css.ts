import { style } from '@vanilla-extract/css';
import { brand, colors, fontSizes, radii, shadows, shapeRadii, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/** Expanded width, and the icon rail it collapses to below 1024 px. */
export const WIDTH = 248;
export const RAIL_WIDTH = 84;
/** Must equal the header height exactly — the two bottom borders form one line. */
export const BRAND_HEIGHT = 76;

export const aside = style({
  flex: 'none',
  position: 'sticky',
  top: 0,
  height: '100vh',
  width: WIDTH,
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  borderRight: `2.5px solid ${colors.black}`,
  '@media': { 'screen and (max-width: 1023px)': { width: RAIL_WIDTH } },
  // Chosen by the owner at any width (P-24); below 1024 px the rail is forced.
  selectors: { '&[data-rail="true"]': { width: RAIL_WIDTH } },
});

/** What the rail hides: labels that would not fit in 84 px. */
const hiddenInRail = { [`${aside}[data-rail="true"] &`]: { display: 'none' } };

export const brandBlock = style({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  minHeight: BRAND_HEIGHT,
  boxSizing: 'border-box',
  padding: '0 16px',
  borderBottom: `2.5px solid ${colors.black}`,
});

export const wordmark = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: brand.wordmarkSidebar,
  lineHeight: brand.wordmarkLineHeight,
  letterSpacing: brand.wordmarkTracking,
  color: colors.black,
  whiteSpace: 'nowrap',
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
  selectors: hiddenInRail,
});

export const nav = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '14px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
});

export const navItem = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: 46,
    padding: '0 12px',
    borderRadius: radii[3],
    // Reserved so the box does not shift when an item becomes active.
    border: '2px solid transparent',
    background: 'transparent',
    boxShadow: 'none',
    color: colors.black,
    textDecoration: 'none',
    fontSize: fontSizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: '-0.01em',
    selectors: {
      '&[aria-current="page"]': {
        background: colors.yellow,
        borderColor: colors.black,
        boxShadow: shadows.small,
        fontWeight: typography.weights.extraBold,
      },
    },
  },
]);

export const navLabel = style({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
  selectors: hiddenInRail,
});

export const divider = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 4px 6px',
});

export const dividerLabel = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
  whiteSpace: 'nowrap',
  paddingLeft: 8,
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
  selectors: hiddenInRail,
});

export const dividerRule = style({ flex: 1, height: 2, background: colors.gray200 });

/** A pending count on a nav row (Revisión de caja): 22 px yellow pill, as in the handoff. */
export const badge = style({
  flex: 'none',
  marginLeft: 'auto',
  minWidth: 22,
  height: 22,
  padding: '0 6px',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

/** «Contraer menú» at the foot of the sidebar; absent below 1024 px, where the rail is forced. */
export const railToggle = style([
  pressable,
  {
    margin: '0 12px 14px',
    height: 40,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    fontWeight: typography.weights.bold,
    cursor: 'pointer',
    '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
  },
]);
