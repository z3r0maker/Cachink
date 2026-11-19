import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * The gasto's «Comprobante» block in the Movimientos drawer (ADR-149, board
 * CgPortal): the photo in a quiet box with «Ver completa» on its corner, or
 * the «Sin comprobante» warning; and the photo full size over everything.
 */

/** The heading (`detalleLinea`) brings its own margins, so the block adds no gap. */
export const seccion = style({ display: 'flex', flexDirection: 'column' });

/** The box the photo sits in: the receipt is grayscale, so the gray reads as paper's edge. */
export const caja = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  height: 250,
  padding: 14,
  boxSizing: 'border-box',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.gray100,
  overflow: 'hidden',
});

export const foto = style({
  display: 'block',
  maxWidth: '100%',
  height: '100%',
  objectFit: 'contain',
  background: colors.white,
});

/** «Ver completa», on the photo's lower right corner. */
export const verCompleta = style({ position: 'absolute', right: 12, bottom: 12 });

export const pie = style({
  margin: '8px 0 0',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const aviso = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.warningSoft,
  border: `2px solid ${colors.warningText}`,
  color: colors.ink,
});

export const avisoIcono = style({ flex: 'none', marginTop: 1, color: colors.warningText });

export const avisoTitulo = style({
  display: 'block',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const avisoTexto = style({
  display: 'block',
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
});

/** The full-size view: over the drawer, on black, the photo as tall as the window allows. */
export const completa = style({
  position: 'fixed',
  zIndex: 51,
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 16,
  boxSizing: 'border-box',
  background: colors.black,
  outline: 'none',
});

export const completaBarra = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: 'min(560px, 100%)',
});

export const completaTitulos = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const completaEtiqueta = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  color: colors.gray200,
});

export const completaTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.white,
  overflowWrap: 'anywhere',
});

export const completaFoto = style({
  display: 'block',
  maxWidth: '100%',
  maxHeight: 'calc(100vh - 120px)',
  objectFit: 'contain',
  background: colors.white,
});
