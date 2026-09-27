import { keyframes, style } from '@vanilla-extract/css';
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

/** «Registrar gasto» as the right drawer (DetalleVenta pattern): 480 px, head, body, foot. */
const entra = keyframes({
  from: { transform: 'translateX(24px)', opacity: 0 },
  to: { transform: 'none', opacity: 1 },
});

export const scrim = style({ position: 'fixed', inset: 0, zIndex: 80, background: colors.scrim });

export const aside = style({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 81,
  width: 'min(480px, 100vw)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: borders.thick,
  background: colors.white,
  animation: `${entra} 160ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const head = style({
  padding: '20px 26px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  borderBottom: borders.quiet,
  background: colors.redSoft,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const cerrar = style([
  pressable,
  {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.black,
  },
]);

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const body = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '18px 26px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const label = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const opcional = style({ fontWeight: typography.weights.semibold, color: colors.textMuted });

export const input = style({
  boxSizing: 'border-box',
  width: '100%',
  height: 52,
  padding: '0 14px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const dinero = style({
  height: 72,
  padding: '0 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: borders.thick,
  borderRadius: radii[4],
  background: colors.white,
});

export const peso = style({
  fontSize: portalFontSizes.pageTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.textMuted,
});

export const montoInput = style({
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.total,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const cat = style([
  pressable,
  {
    height: 44,
    padding: '0 16px',
    border: borders.quiet,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: {
      '&[aria-pressed="true"]': {
        border: borders.thin,
        background: colors.yellow,
        boxShadow: `2px 2px 0 ${colors.black}`,
      },
    },
  },
]);

export const firma = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const foot = style({
  padding: '16px 26px 22px',
  display: 'flex',
  gap: 10,
  borderTop: borders.quiet,
});

export const cancelar = style([
  pressable,
  {
    height: 54,
    padding: '0 20px',
    border: borders.quiet,
    borderRadius: radii[3],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
]);

export const guardar = style([
  pressable,
  {
    flex: 1,
    height: 54,
    border: borders.thick,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.lg,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
    selectors: { '&:disabled': { opacity: 0.55, boxShadow: 'none' } },
  },
]);
