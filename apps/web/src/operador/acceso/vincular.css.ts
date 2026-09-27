import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** OpVincular: three numbered steps, the code as eight boxes. */

export const pasos = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
});

export const paso = style({ display: 'flex', gap: 14 });

export const numero = style({
  width: 32,
  height: 32,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  selectors: { '&[data-hecho="true"]': { background: colors.yellow } },
});

export const cuerpo = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const etiquetaFila = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 32,
});

export const etiqueta = style({
  fontSize: portalFontSizes.lg,
  lineHeight: '32px',
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const cuenta = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const campo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 56,
  padding: '0 16px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  color: colors.gray600,
  selectors: { '&:focus-within': { boxShadow: `0 0 0 4px ${colors.yellow}` } },
});

export const input = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.bold,
  color: colors.black,
  // The field around it draws the focus ring (focus-within).
  selectors: { '&:focus-visible': { outline: 'none' } },
});

export const codigo = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

export const caja = style({
  flex: 1,
  minWidth: 0,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.offwhite,
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  selectors: {
    '&[data-estado="lleno"]': {
      border: borders.thick,
      background: colors.white,
      boxShadow: `2px 2px 0 ${colors.black}`,
    },
    '&[data-estado="siguiente"]': { border: borders.thin },
    [`${codigo}:focus-within &[data-estado="siguiente"]`]: { background: colors.yellow },
    '&[data-estado="error"]': {
      border: borders.thick,
      borderColor: colors.redText,
      background: colors.redSoft,
    },
  },
  '@media': { [PHONE]: { height: 52, fontSize: portalFontSizes.xl2 } },
});

export const punto = style({
  width: 14,
  flex: 'none',
  textAlign: 'center',
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  color: colors.textMuted,
});

/** The real input lies over the boxes, invisible: typing, paste and IME all work. */
export const codigoInput = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  border: 'none',
  fontSize: portalFontSizes.xl4,
  caretColor: 'transparent',
  cursor: 'text',
});

export const ayuda = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const fuerte = style({ fontWeight: typography.weights.extraBold, color: colors.black });

export const aviso = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const avisoTexto = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const acciones = style({ display: 'flex', flexDirection: 'column', gap: 10 });
