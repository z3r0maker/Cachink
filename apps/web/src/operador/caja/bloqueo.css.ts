import { keyframes, style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

const pop = keyframes({ from: { transform: 'scale(0.9)', opacity: 0 }, to: { transform: 'none' } });

/** «Caja bloqueada» (OpBloqueo): the register behind a blur, one card with the keypad. */
export const scrim = style({
  position: 'fixed',
  inset: 0,
  zIndex: 90,
  overflowY: 'auto',
  background: colors.scrim,
  backdropFilter: 'blur(3px)',
});

/* `minHeight` + grid instead of centring the card directly: a tall card must
 * scroll into view, not overflow both edges of a short screen. */
export const centro = style({
  minHeight: '100%',
  display: 'grid',
  placeItems: 'center',
  padding: 16,
});

export const card = style({
  boxSizing: 'border-box',
  width: 'min(460px, 100%)',
  padding: '26px 32px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: shadows.hero,
  animation: `${pop} 220ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
    'screen and (max-width: 420px)': { padding: '20px 18px 14px' },
  },
});

export const fila = style({ display: 'flex', alignItems: 'center', gap: 14 });

export const candado = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 60,
  height: 60,
  display: 'grid',
  placeItems: 'center',
  border: borders.thick,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  boxShadow: shadows.small,
  color: colors.black,
});

export const titulos = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const quien = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const fuerte = style({ fontWeight: typography.weights.extraBold, color: colors.black });

export const iniciales = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nota = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.offwhite,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const notaTexto = style({ flex: 1, minWidth: 160 });

export const chip = style({
  padding: '2px 10px',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const operador = style([
  pressable,
  {
    minHeight: 52,
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: borders.quiet,
    borderRadius: radii[3],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textAlign: 'left',
    selectors: {
      '&[aria-pressed="true"]': { border: borders.thin, background: colors.yellowSoft },
    },
  },
]);

export const lista = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const enlace = style({
  alignSelf: 'center',
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  border: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
});
