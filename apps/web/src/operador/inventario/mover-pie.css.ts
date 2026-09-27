import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The movement panel's foot: what the move does, and its two buttons. */
export const explica = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const botones = style({ display: 'flex', gap: 10 });

export const registrar = style([
  pressable,
  {
    flex: 1,
    minHeight: 54,
    padding: '0 14px',
    border: borders.thick,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.lg,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
  },
]);

export const cancelar = style([
  pressable,
  {
    minHeight: 54,
    padding: '0 18px',
    border: borders.quiet,
    borderRadius: radii[3],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
]);
