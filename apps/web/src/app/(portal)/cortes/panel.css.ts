import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

const TABULAR = 'tabular-nums';
const RENGLON = `2px solid ${colors.gray100}`;

/** The corte's side panel (CfgCortes): figures, the explanation, the count, the rest. */
export const cuerpo = style({ display: 'flex', flexDirection: 'column', gap: 18 });

export const seccion = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const ceja = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const cifras = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[4],
});

export const cifraCelda = style({
  minWidth: 0,
  padding: '10px 14px',
  '@media': { '(max-width: 480px)': { padding: '10px 8px' } },
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  selectors: { '&:not(:last-child)': { borderRight: borders.quiet } },
});

export const cifraEtiqueta = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const cifraValor = style({
  fontSize: portalFontSizes.cardTitle,
  '@media': { '(max-width: 480px)': { fontSize: portalFontSizes.body } },
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.black,
});

export const nota = style({
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const motivo = style({
  alignSelf: 'flex-start',
  padding: '3px 10px',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const notaTexto = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const meta = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: TABULAR,
  color: colors.gray600,
});

export const don = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: radii[3],
  background: colors.warningSoft,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const tabla = style({
  padding: '4px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
});

export const renglon = style({
  minHeight: 34,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  borderBottom: RENGLON,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const total = style({
  minHeight: 38,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const monto = style({
  flex: 'none',
  whiteSpace: 'nowrap',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
});

export const evento = style([
  renglon,
  {
    minHeight: 38,
    padding: '0 12px',
    border: RENGLON,
    borderRadius: radii[1],
  },
]);

export const pie = style({ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 });

export const botones = style({ display: 'flex', gap: 10, flexWrap: 'wrap' });

export const pieNota = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
