import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, shapeRadii, typography } from '@xangarro/tokens';

import { PHONE } from '../../shell/shell.css';

const slide = keyframes({
  from: { opacity: 0, transform: 'translateX(60px)' },
  to: { opacity: 1, transform: 'none' },
});

/** The ticket's side panel over Ventas (OpVentas, the DetalleVenta drawer pattern). */
export const overlay = style({ position: 'fixed', inset: 0, zIndex: 80, background: colors.scrim });

export const panel = style({
  position: 'fixed',
  zIndex: 81,
  top: 0,
  right: 0,
  bottom: 0,
  boxSizing: 'border-box',
  width: 'min(480px, 100vw)',
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  borderLeft: borders.thick,
  animation: `${slide} 280ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
    [PHONE]: { borderLeft: 0 },
  },
});

const lados = {
  paddingLeft: 26,
  paddingRight: 26,
  '@media': { [PHONE]: { paddingLeft: 18, paddingRight: 18 } },
} as const;

export const head = style({
  ...lados,
  paddingTop: 22,
  paddingBottom: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  borderBottom: borders.quiet,
});

export const headTop = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });
export const cerrar = style({ marginLeft: 'auto' });

export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const dot = style({ width: 7, height: 7, borderRadius: shapeRadii.pill });

export const monto = style({
  margin: 0,
  fontSize: portalFontSizes.displayLg,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  selectors: { '&[data-cancelada]': { color: colors.textMuted, textDecoration: 'line-through' } },
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const body = style({
  ...lados,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingTop: 18,
  paddingBottom: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});

export const foot = style({
  ...lados,
  paddingTop: 16,
  paddingBottom: 22,
  display: 'flex',
  gap: 10,
  borderTop: borders.quiet,
  '@media': { [PHONE]: { flexDirection: 'column', paddingLeft: 18, paddingRight: 18 } },
});

export const crece = style({ flex: 1 });
