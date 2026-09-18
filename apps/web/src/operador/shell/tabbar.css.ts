import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

import { PHONE } from './shell.css';

const contentBox = { boxSizing: 'content-box' } as const;

/* Phone tab bar ------------------------------------------------------- */

export const tabbar = style({
  ...contentBox,
  display: 'none',
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 60,
  height: 68,
  gridTemplateColumns: 'repeat(4, 1fr)',
  background: colors.white,
  borderTop: `2.5px solid ${colors.black}`,
  '@media': { [PHONE]: { display: 'grid' } },
});

export const tab = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  borderLeft: `2px solid ${colors.black}`,
  background: colors.white,
  color: colors.black,
  textDecoration: 'none',
  selectors: {
    '&:first-child': { borderLeft: 'none' },
    '&[aria-current="page"]': { background: colors.yellow },
  },
});

export const tabLabel = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.02em',
});
