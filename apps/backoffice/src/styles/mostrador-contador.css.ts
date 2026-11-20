import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { monoStack } from './theme.css';

/**
 * The contador's export (E-43): board CD-10d's package drawer (what goes in
 * it, the balanza as the CSV writes it) and board CD-10e's códigos
 * agrupadores, each account with its code.
 */
export const parte = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 0',
  borderTop: `2px solid ${colors.gray100}`,
});

export const parteTexto = style({
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const parteNombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const detalle = styleVariants({
  normal: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray600,
  },
  aviso: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
  },
});

export const archivo = style({
  flex: '0 0 auto',
  fontFamily: monoStack,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const codigo = style({ fontFamily: monoStack, fontWeight: typography.weights.bold });

export const sinCodigo = style({
  padding: '2px 8px',
  border: borders.thin,
  borderColor: colors.warningText,
  borderRadius: radii[0],
  background: colors.warningSoft,
  color: colors.warningText,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const celdaTotal = style({
  padding: '12px',
  borderTop: borders.thin,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const celdaTotalNum = style([celdaTotal, { textAlign: 'right' }]);

export const pasos = style({
  margin: 0,
  padding: '14px 16px 14px 34px',
  borderRadius: radii[3],
  background: colors.offwhite,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
});

export const grupo = style({
  padding: '16px 12px 6px',
  textAlign: 'left',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  borderBottom: borders.thin,
});

const entrada = {
  width: 120,
  padding: '9px 11px',
  border: borders.thin,
  borderRadius: radii[1],
  fontFamily: monoStack,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
} as const;

export const entradaCodigo = styleVariants({
  normal: { ...entrada, background: colors.white },
  falta: { ...entrada, borderColor: colors.warningText, background: colors.warningSoft },
});

export const falta = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.warningText,
});

export const conCodigo = style({ display: 'flex', alignItems: 'center', gap: 8 });
