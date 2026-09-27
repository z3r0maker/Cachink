import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** The preview column: a dotted desk, the paper on it, the downloads under it. */
export const columna = style({ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 });

export const mesa = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  padding: '14px 18px 22px',
  borderRadius: radii[6],
  border: borders.quiet,
  background: colors.gray100,
  backgroundImage: `radial-gradient(${colors.gray200} 1px, transparent 1px)`,
  backgroundSize: '14px 14px',
  overflow: 'hidden',
  '@media': { '(max-width: 520px)': { padding: '12px 10px 18px' } },
});

export const mesaCabeza = style({
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  color: colors.gray600,
});

export const vivo = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: shapeRadii.pill,
  background: colors.greenSoft,
  border: `2px solid ${colors.greenText}`,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.greenText,
});

export const vivoPunto = style({
  width: 7,
  height: 7,
  borderRadius: shapeRadii.pill,
  background: colors.green,
});

export const plantillaNombre = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const descargas = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
});

export const descarga = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 14px',
  borderRadius: radii[2],
  border: borders.quiet,
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'none',
  selectors: { '&:hover': { borderColor: colors.black } },
});

export const descargaNota = style({
  flex: 1,
  minWidth: 180,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.35,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
