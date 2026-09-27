import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The one close button at the column's foot, and the line that says why it waits. */
export const pie = style({ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 });

export const cerrar = style([
  pressable,
  {
    boxSizing: 'border-box',
    minHeight: 60,
    padding: '8px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    border: borders.thick,
    borderRadius: radii[4],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textAlign: 'center',
    selectors: {
      '&:disabled': {
        opacity: 1,
        border: `2px solid ${colors.gray400}`,
        background: colors.gray100,
        boxShadow: 'none',
        color: colors.textMuted,
      },
    },
  },
]);

export const hint = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textAlign: 'center',
  textWrap: 'pretty',
});
