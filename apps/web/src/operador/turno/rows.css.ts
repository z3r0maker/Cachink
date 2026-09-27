import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Mi turno's list rows: pendientes de registrar and the movements. */
export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '12px 20px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const main = style({
  flex: '1 1 220px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const nameLine = style({ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' });

export const monto = style({
  flex: 'none',
  marginLeft: 'auto',
  marginRight: 6,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const actions = style({ flex: 'none', display: 'flex', gap: 8 });

export const hora = style({
  flex: 'none',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const nada = style({
  padding: 18,
  textAlign: 'center',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const verTodos = style([
  pressable,
  {
    marginLeft: 'auto',
    height: 40,
    padding: '0 12px',
    border: borders.quiet,
    borderRadius: radii[1],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
]);
