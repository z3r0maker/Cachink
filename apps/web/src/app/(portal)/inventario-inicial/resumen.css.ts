import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** The aside's valuation card: progress, the save, the one-time note, the done card. */
export const progreso = style({ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 });

export const progresoFila = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const numero = style({ fontVariantNumeric: 'tabular-nums', fontSize: portalFontSizes.body });

export const pista = style({
  position: 'relative',
  height: 10,
  overflow: 'hidden',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
});

export const relleno = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  borderRadius: shapeRadii.pill,
  background: colors.green,
  transition: 'width 200ms ease-out',
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});

export const candado = style({
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.warningSoft,
  color: colors.warningText,
});

export const candadoTexto = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const listo = style({
  width: 64,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.green,
  border: borders.thick,
  color: colors.black,
});

export const listoTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const listoCard = style({ maxWidth: 640, alignItems: 'flex-start' });

export const enlaceBoton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 50,
  padding: '0 20px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
  selectors: { '&:hover': { background: colors.yellowSoft, color: colors.black } },
});
