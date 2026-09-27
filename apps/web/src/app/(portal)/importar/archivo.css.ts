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

/** The chosen file's head, the waiting line and the done panel. */
export const cabeza = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '12px 16px',
  borderBottom: borders.quiet,
});

export const icono = style({
  flex: 'none',
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.greenSoft,
  color: colors.black,
});

export const nombre = style({ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 });

export const nombreTexto = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const info = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const esperando = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '28px 20px',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

const pop = keyframes({ from: { transform: 'scale(0.96)', opacity: 0 }, to: {} });

export const listo = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  padding: '36px 24px',
  textAlign: 'center',
  animation: `${pop} 300ms cubic-bezier(.3,1.4,.5,1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const listoCirculo = style({
  width: 64,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  border: borders.thick,
  borderRadius: shapeRadii.pill,
  background: colors.green,
  boxShadow: shadows.small,
  color: colors.black,
});

export const listoTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const listoTexto = style({
  margin: 0,
  maxWidth: 520,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const listoAcciones = style({
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: 6,
});

export const enlace = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 48,
  padding: '0 18px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
  selectors: { '&:hover': { background: colors.yellowSoft, color: colors.black } },
});
