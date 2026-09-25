import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shadows, shapeRadii } from '@xangarro/tokens';

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

export const menuHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px 12px',
  marginBottom: 4,
  borderBottom: `2px solid ${colors.gray200}`,
});

export const menuName = style({
  display: 'block',
  fontSize: fontSizes.md,
  fontWeight: 800,
  color: colors.black,
});

export const menuRole = style({
  display: 'block',
  fontSize: fontSizes.xs,
  fontWeight: 600,
  color: colors.gray600,
});

export const itemLink = style([item, { gap: 12, color: colors.black, textDecoration: 'none' }]);

export const pill = style({
  marginLeft: 'auto',
  padding: '2px 8px',
  borderRadius: shapeRadii.pill,
  border: `2px solid ${colors.black}`,
  fontSize: fontSizes.xs,
  fontWeight: 800,
});

export const pillTone = {
  plan: style({ background: colors.yellow, color: colors.black }),
  warn: style({
    background: colors.warningSoft,
    color: colors.warningText,
    borderColor: colors.warningText,
  }),
};

export const separator = style({ height: 2, margin: '4px 0', background: colors.gray200 });

export const logoutItem = style([item, { gap: 12, color: colors.redText }]);
