import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** OpAbrirTurno: «¿Con cuánto empiezas?» as the centred dialog over the door. */

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  placeItems: 'start center',
  padding: '96px 16px 16px',
  overflowY: 'auto',
  background: colors.scrim,
});

export const dialog = style({
  position: 'relative',
  width: 'min(560px, 100%)',
  margin: 'auto 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '0 32px 26px',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: `6px 6px 0 ${colors.black}`,
  '@media': { [PHONE]: { padding: '0 18px 20px' } },
});

export const cerrar = style([
  pressable,
  {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.gray600,
  },
]);

export const don = style({ alignSelf: 'center', marginTop: -76 });

export const titulos = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'center',
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl2 } },
});

export const sub = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const bloque = style({ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 });

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const campo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 84,
  padding: '0 20px',
  border: borders.thick,
  borderRadius: radii[5],
  background: colors.yellowSoft,
  boxShadow: shadows.card,
  selectors: {
    '&:focus-within': { boxShadow: `0 0 0 4px ${colors.yellow}, ${shadows.card}` },
  },
  '@media': { [PHONE]: { height: 72, padding: '0 14px' } },
});

const cifra = {
  fontSize: portalFontSizes.displayLg,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl6 } },
} as const;

export const signo = style(cifra);

export const input = style({
  ...cifra,
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
  // The field around it draws the focus ring (focus-within).
  selectors: { '&:focus-visible': { outline: 'none' } },
});

export const mxn = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const chips = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 8,
});

export const chip = style([
  pressable,
  {
    height: 44,
    border: borders.thin,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
    selectors: { '&[aria-pressed="true"]': { background: colors.black, color: colors.yellow } },
  },
]);

export const nota = style({
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.offwhite,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const alerta = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});
