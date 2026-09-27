import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Mi negocio · General (CfgNegocio): quiet panels, one row per value. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 16 });

export const dosColumnas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  '@media': { '(max-width: 900px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '18px 22px 10px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  '@media': { '(max-width: 520px)': { padding: '16px 16px 8px' } },
});

export const panelHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 6,
  flexWrap: 'wrap',
});

export const tile = style({
  width: 38,
  height: 38,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[1],
  color: colors.black,
});

export const panelTitle = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const panelAccion = style({ marginLeft: 'auto' });

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 48,
  boxSizing: 'border-box',
  padding: '8px 0',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
  // A phone stacks the value under its label instead of squeezing both.
  '@media': {
    '(max-width: 520px)': { flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
  },
});

export const filaLabel = style({
  flex: 'none',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const filaValor = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  '@media': { '(max-width: 520px)': { marginLeft: 0, textAlign: 'left' } },
});

const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

/** An unfilled value is amber: a thing to do, not an absence. */
export const falta = style([
  pill,
  {
    marginLeft: 'auto',
    '@media': { '(max-width: 520px)': { marginLeft: 0 } },
    background: colors.warningSoft,
    color: colors.warningText,
    border: `2px solid ${colors.warningText}`,
  },
]);

export const faltaPunto = style({
  width: 7,
  height: 7,
  borderRadius: shapeRadii.pill,
  background: colors.warning,
});

export const predeterminado = style([
  pill,
  {
    padding: '2px 8px',
    fontSize: portalFontSizes.tag,
    background: colors.gray100,
    color: colors.gray600,
  },
]);

/** The small cards under the data: atributos and «Volver a configurar». */
export const compacta = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '16px 22px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  color: colors.black,
  textDecoration: 'none',
  '@media': { '(max-width: 520px)': { padding: '14px 16px' } },
});

export const enlace = style([
  compacta,
  {
    selectors: {
      '&:hover': { borderColor: colors.black, background: colors.yellowSoft },
      '&:focus-visible': { outline: `3px solid ${colors.blueText}`, outlineOffset: 2 },
    },
  },
]);

export const compactaTexto = style({
  // Basis, not just grow: on a phone the button wraps under the text.
  flex: '1 1 180px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const compactaTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const compactaSub = style({
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** Archivar: a quiet row at the bottom, behind a rule. */
export const archivar = style({
  marginTop: 6,
  paddingTop: 18,
  borderTop: borders.quiet,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
});

export const archivarTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nota = style({ margin: 0, fontWeight: typography.weights.bold });
