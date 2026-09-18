import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shadows } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/** The user menu: a card, like every other raised surface (border + shadow). */
export const menu = style({
  minWidth: 200,
  padding: 6,
  background: colors.white,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  boxShadow: shadows.card,
  zIndex: 50,
});

export const item = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 44,
    padding: '0 12px',
    background: colors.white,
    border: 0,
    borderRadius: radii[0],
    boxShadow: 'none',
    fontSize: fontSizes.md,
    fontWeight: 700,
    textAlign: 'left',
    cursor: 'pointer',
    selectors: { '&[data-highlighted]': { background: colors.yellowSoft, outline: 'none' } },
  },
]);
