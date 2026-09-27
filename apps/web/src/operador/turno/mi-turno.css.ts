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
import { PHONE } from '../shell/shell.css';

const NUM = 'tabular-nums';

/** Operador · Mi turno (`OpTurno.dc.html`, El Mostrador). */
const NARROW = 'screen and (max-width: 1179px)';

export const top = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.08fr)',
  gap: 20,
  alignItems: 'stretch',
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const right = style({ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 });

export const stats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media': { [PHONE]: { gap: 10 } },
});

/* Efectivo que debe haber ------------------------------------------------ */

export const hero = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '22px 26px 24px',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.yellow,
  boxShadow: shadows.hero,
  '@media': { [PHONE]: { padding: 18 } },
});

export const heroLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.ink,
});

export const heroAmount = style({
  marginTop: 6,
  fontSize: portalFontSizes.hero,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: NUM,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.displayLg } },
});

export const heroText = style({
  marginTop: 8,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const parts = style({ margin: '16px 0 14px', display: 'flex', flexDirection: 'column' });

export const part = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  borderBottom: `2px solid ${colors.yellowRule}`,
  selectors: { '&:nth-last-child(2)': { borderBottom: borders.thin } },
});

export const partLabel = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const partNote = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.ink,
  opacity: 0.8,
});

export const partValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: NUM,
  color: colors.black,
});

export const total = style({ display: 'flex', alignItems: 'center', minHeight: 48 });

export const totalLabel = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const totalValue = style([partValue, { fontSize: portalFontSizes.cardTitle }]);

export const cerrar = style([
  pressable,
  {
    marginTop: 'auto',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    border: borders.thick,
    borderRadius: radii[4],
    background: colors.black,
    boxShadow: `4px 4px 0 ${colors.white}`,
    fontSize: portalFontSizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.yellow,
    textDecoration: 'none',
  },
]);

/* Cobrado por método ----------------------------------------------------- */

export const metodos = style({
  flex: 1,
  padding: '14px 20px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});

export const metodoHead = style({ display: 'flex', alignItems: 'baseline', gap: 8 });

export const metodoLabel = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const metodoNota = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const metodoMonto = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: NUM,
  color: colors.black,
});

export const metodoPct = style({
  width: 40,
  textAlign: 'right',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: NUM,
  color: colors.textMuted,
});

export const track = style({
  marginTop: 6,
  height: 14,
  overflow: 'hidden',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
});

const grow = keyframes({ from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } });

export const bar = style({
  boxSizing: 'border-box',
  height: '100%',
  borderRadius: shapeRadii.pill,
  borderRight: borders.thin,
  transformOrigin: 'left center',
  animation: `${grow} 500ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const panelTotal = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: NUM,
  color: colors.black,
});
