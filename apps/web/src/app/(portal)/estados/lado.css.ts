import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** Beside the cascade (ADR-107): break-even, margins, Don Cuentas. */
export const lado = style({ display: 'grid', gap: 14, alignContent: 'start' });

export const eyebrow = style({
  margin: 0,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const equilibrio = style({
  display: 'grid',
  gap: 8,
  padding: '18px 20px',
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[6],
  boxShadow: shadows.card,
});

export const lead = style({ fontSize: portalFontSizes.body, fontWeight: typography.weights.bold });

export const meta = style({
  fontSize: portalFontSizes.total,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
});

export const metaSub = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  letterSpacing: 0,
  color: colors.textMuted,
});

export const pista = style({
  position: 'relative',
  height: 26,
  marginTop: 4,
  overflow: 'hidden',
  background: colors.gray100,
  border: borders.thin,
  borderRadius: shapeRadii.pill,
});

const llenar = keyframes({ from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } });

export const relleno = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  background: colors.yellow,
  borderRight: borders.thin,
  transformOrigin: 'left center',
  animation: `${llenar} 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const pistaTexto = style({
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const explica = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const margenes = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
});

export const margen = style({
  display: 'grid',
  gap: 4,
  alignContent: 'start',
  padding: '14px 16px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[5],
});

const cifra = {
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
} as const;

export const margenValor = styleVariants({
  bien: { ...cifra, color: colors.greenText },
  mal: { ...cifra, color: colors.redText },
});

export const mermas = style({ display: 'grid', gap: 8, margin: 0, padding: 0, listStyle: 'none' });

export const merma = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  fontSize: portalFontSizes.body,
});

export const mermaSub = style({
  display: 'block',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const mermaMonto = style({ color: colors.redText, fontVariantNumeric: 'tabular-nums' });

export const mermaNota = style({
  margin: '16px 0 0',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
