import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The corte answered in place: the note, the quick answers, and what was sent. */
export const reply = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const label = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const input = style({
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 96,
  padding: '12px 14px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  resize: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.black,
  selectors: {
    '&:focus-visible': { boxShadow: `0 0 0 3px ${colors.yellow}` },
    '&::placeholder': { color: colors.textMuted },
  },
});

export const rapidas = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 });

export const rapidasLabel = style({
  marginRight: 2,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
});

export const rapida = style([
  pressable,
  {
    height: 44,
    padding: '0 14px',
    border: borders.quiet,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: {
      '&:hover': { background: colors.yellowSoft },
      '&[aria-pressed="true"]': {
        borderColor: colors.black,
        background: colors.black,
        color: colors.yellow,
      },
    },
  },
]);

export const enviar = style({
  height: 52,
  selectors: { '&:disabled': { boxShadow: 'none' } },
});

export const enviado = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '14px 16px',
  border: `2px solid ${colors.greenText}`,
  borderRadius: radii[3],
  background: colors.greenSoft,
});

export const enviadoTitle = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.greenText,
});

export const enviadoText = style({
  lineHeight: 1.45,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const enviadoNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/* «Nada por leer» -------------------------------------------------------- */

export const empty = style({
  maxWidth: 880,
  boxSizing: 'border-box',
  padding: '40px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  textAlign: 'center',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const emptyTitle = style({
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const emptyBody = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
