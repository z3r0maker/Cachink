import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../../styles/press.css';

/** «Recordarle su saldo»: copy the message, open WhatsApp, and the line under them. */
export const acciones = style({ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' });

const accion = {
  height: 52,
  boxSizing: 'border-box',
  padding: '0 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: radii[3],
  fontFamily: 'inherit',
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
} as const;

export const copiar = style([
  pressable,
  { ...accion, border: borders.quiet, background: colors.white, fontSize: portalFontSizes.body },
]);

export const abrir = style([
  pressable,
  {
    ...accion,
    flex: 1,
    border: borders.thick,
    background: colors.yellow,
    boxShadow: shadows.small,
    fontSize: portalFontSizes.lg,
    selectors: {
      '&[aria-disabled="true"]': {
        border: borders.quiet,
        background: colors.gray100,
        boxShadow: 'none',
        color: colors.textMuted,
        cursor: 'not-allowed',
      },
    },
  },
]);

export const nota = style({
  marginTop: -6,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});
