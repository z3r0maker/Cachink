import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

/**
 * The first-day screens' shared frame (`CfgImportar`, `CfgInventarioInicial`,
 * `CfgSaldosIniciales`): the «Primeros pasos» trail, the heading, a work
 * column beside a 340px aside, quiet panels, the hero card and the notices.
 */
const PHONE = 'screen and (max-width: 767px)';
const NARROW = 'screen and (max-width: 1023px)';

export const ruta = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const rutaLink = style({
  color: colors.gray600,
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  selectors: { '&:hover': { color: colors.black } },
});

export const rutaAqui = style({ color: colors.black });

export const cabeza = style({ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' });

export const cabezaTexto = style({ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl5 } },
});

export const subtitulo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

/** Work column + 340px aside; one column below 1024px. */
export const dosColumnas = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 340px',
  gap: 22,
  alignItems: 'start',
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const columna = style({ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 });

export const aside = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  position: 'sticky',
  top: 16,
  '@media': { [NARROW]: { position: 'static' } },
});

export const eyebrow = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

/** Quiet panel: white, gray200 edge, radius 20. */
export const panel = style({
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  overflow: 'hidden',
  minWidth: 0,
});

/** Hero card: black edge, radius 22, hard shadow. */
export const hero = style({
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
  padding: 22,
  '@media': { 'screen and (max-width: 767px)': { padding: 16 } },
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});

export const cifra = style({
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  overflowWrap: 'anywhere',
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl5 } },
});

export const nota = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const texto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});
