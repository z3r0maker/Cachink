import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** The amber band while records wait: a warning, the close stays open (DS-06 (a), ADR-121). */
export const banda = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
  padding: '10px 18px 10px 12px',
  border: borders.thick,
  borderRadius: radii[6],
  background: colors.warningSoft,
  boxShadow: `4px 4px 0 ${colors.warningText}`,
  '@media': { [PHONE]: { gap: 10, padding: 12 } },
});

export const cuerpo = style({
  flex: '1 1 280px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  lineHeight: 1.3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
});

export const texto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const estado = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

export const acciones = style({ display: 'flex', alignItems: 'center', gap: 8 });

export const reintentar = style([
  pressable,
  {
    flex: 'none',
    height: 48,
    padding: '0 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: borders.thin,
    borderRadius: radii[3],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
  },
]);

const giro = keyframes({ to: { transform: 'rotate(360deg)' } });

export const gira = style({
  display: 'inline-flex',
  animation: `${giro} 900ms linear infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const verCuales = style({
  flex: 'none',
  minHeight: 48,
  padding: '0 6px',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});
