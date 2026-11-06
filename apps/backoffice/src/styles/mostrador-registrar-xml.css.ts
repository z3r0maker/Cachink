import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Registrar gasto with one XML (E-11, boards CD-01 and CD-06d): the drop
 * zone, the «leído» banner and the XML's figures.
 */
export const zonaTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const adjunto = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.offwhite,
  flexWrap: 'wrap',
});

export const adjuntoIcono = style({ flex: '0 0 auto', color: colors.greenText });

export const adjuntoTexto = style({
  flex: '1 1 260px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const adjuntoTitulo = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const adjuntoSub = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  overflowWrap: 'anywhere',
});

export const delXml = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  margin: 0,
  padding: '14px 16px',
  borderRadius: radii[4],
  background: colors.offwhite,
});

export const delXmlLista = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  margin: 0,
});

export const delXmlTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const delXmlFila = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
});

export const delXmlValor = styleVariants({
  normal: { margin: 0, fontWeight: typography.weights.bold, fontVariantNumeric: 'tabular-nums' },
  debe: {
    margin: 0,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
    fontVariantNumeric: 'tabular-nums',
  },
  total: {
    margin: 0,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
  },
});

export const delXmlNota = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.warningText,
});
