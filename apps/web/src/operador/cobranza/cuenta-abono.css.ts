import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** «Recibir abono» inside the account panel: amount, how it is paid, where it lands. */
export const caja = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  border: borders.thin,
  borderRadius: radii[5],
  background: colors.yellowSoft,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.black,
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const label = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const monto = style({
  height: 52,
  boxSizing: 'border-box',
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: borders.thick,
  borderRadius: radii[3],
  background: colors.white,
  selectors: {
    '&:focus-within': { outline: borders.thick, outlineColor: colors.blueText, outlineOffset: 2 },
  },
});

export const signo = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const input = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  selectors: { '&:focus-visible': { outline: 'none', boxShadow: 'none' } },
});

export const rapidos = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });

const eleccion = {
  height: 44,
  borderRadius: radii[2],
  fontFamily: 'inherit',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  background: colors.white,
  color: colors.black,
} as const;

export const rapido = style([
  pressable,
  {
    ...eleccion,
    padding: '0 14px',
    border: borders.thin,
    fontSize: portalFontSizes.md,
    selectors: { '&[aria-pressed="true"]': { background: colors.black, color: colors.yellow } },
  },
]);

export const metodos = style({ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' });

export const metodosLabel = style([label, { flex: 'none', whiteSpace: 'nowrap' }]);

export const metodo = style([
  pressable,
  {
    ...eleccion,
    flex: '1 1 0',
    minWidth: 96,
    padding: '0 8px',
    border: borders.quiet,
    fontSize: portalFontSizes.sm,
    selectors: {
      '&[aria-checked="true"]': {
        border: borders.thin,
        background: colors.black,
        color: colors.yellow,
      },
    },
  },
]);

export const aplica = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  paddingTop: 8,
  borderTop: borders.quiet,
});

export const aplicaTexto = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const aplicaFuerte = style({ fontWeight: typography.weights.extraBold });

export const restanteRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const restante = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.warningText,
});

export const recibir = style([
  pressable,
  {
    minHeight: 54,
    padding: '0 14px',
    border: borders.thick,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.lg,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
  },
]);
