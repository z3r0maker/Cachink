import { style } from '@vanilla-extract/css';
import {
  brand,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/**
 * The operator shell, measured from the design files at 1440 and 375 px.
 *
 * The files size fixed boxes content-box (a 46 px nav row with 2 px borders
 * renders 50 px; the 248 px sidebar with its 2.5 px border renders 250.5), so
 * those boxes restore `content-box` over the portal's border-box reset.
 */
const contentBox = { boxSizing: 'content-box' } as const;

/** The handoff's phone breakpoint: below 760 px the sidebar becomes a tab bar. */
export const PHONE = 'screen and (max-width: 759px)';

export const frame = style({
  minHeight: '100vh',
  display: 'flex',
  background: colors.gray200,
  color: colors.ink,
});

export const column = style({ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' });

/* Sidebar -------------------------------------------------------------- */

export const aside = style({
  ...contentBox,
  flex: 'none',
  width: 248,
  height: '100vh',
  position: 'sticky',
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  borderRight: `2.5px solid ${colors.black}`,
  '@media': { [PHONE]: { display: 'none' } },
});

export const brandBlock = style({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  minHeight: 76,
  padding: '0 16px',
  borderBottom: `2.5px solid ${colors.black}`,
});

export const wordmark = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: brand.wordmarkSidebar,
  lineHeight: brand.wordmarkLineHeight,
  color: colors.black,
  whiteSpace: 'nowrap',
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
    ...contentBox,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: 46,
    padding: '0 12px',
    borderRadius: radii[3],
    border: '2px solid transparent',
    color: colors.black,
    textDecoration: 'none',
    fontWeight: typography.weights.bold,
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
  fontSize: portalFontSizes.body,
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
});

/* Sidebar footer: who holds the turno, lock and close. */

export const foot = style({
  padding: '14px 12px',
  borderTop: `2.5px solid ${colors.black}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const who = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const avatar = style({
  ...contentBox,
  flex: 'none',
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const whoName = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const whoSub = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const footActions = style({ display: 'flex', gap: 8 });

const footButton = {
  ...contentBox,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  boxShadow: shadows.small,
  color: colors.black,
} as const;

export const lockButton = style([pressable, { ...footButton, flex: 'none', width: 42 }]);

export const closeLink = style([
  pressable,
  {
    ...footButton,
    flex: 1,
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    textDecoration: 'none',
  },
]);
