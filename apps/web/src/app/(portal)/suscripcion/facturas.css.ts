import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Facturas» (CfgPlan): a quiet panel with one row per payment and its CFDI. */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '18px 22px 8px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 8,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const fiscal = style({
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 32,
  padding: '6px 12px',
  borderRadius: shapeRadii.pill,
  background: colors.blueSoft,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'none',
});

export const fiscalLink = style({
  fontWeight: typography.weights.extraBold,
  textDecoration: 'underline',
});

const columnas = '190px minmax(0, 1fr) 100px 240px 230px';

export const encabezados = style({
  display: 'grid',
  gridTemplateColumns: columnas,
  gap: 12,
  padding: '8px 0',
  borderBottom: borders.quiet,
  '@media': { '(max-width: 900px)': { display: 'none' } },
});

export const lista = style({ margin: 0, padding: 0, listStyle: 'none' });

export const fila = style({
  display: 'grid',
  gridTemplateColumns: columnas,
  gridTemplateAreas: '"fecha concepto total estado acciones"',
  gap: 12,
  alignItems: 'center',
  minHeight: 56,
  padding: '6px 0',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
  '@media': {
    '(max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gridTemplateAreas: '"fecha total" "concepto concepto" "estado estado" "acciones acciones"',
      gap: 6,
      padding: '12px 0',
    },
  },
});

export const fecha = style({
  gridArea: 'fecha',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const concepto = style({
  gridArea: 'concepto',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const total = style({
  gridArea: 'total',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  color: colors.black,
});

export const estado = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  minWidth: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  overflowWrap: 'anywhere',
  gridArea: 'estado',
});

const pill = {
  padding: '3px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
} as const;

export const tono = styleVariants({
  timbrada: {
    ...pill,
    border: `2px solid ${colors.greenText}`,
    background: colors.greenSoft,
    color: colors.greenText,
  },
  en_global: {
    ...pill,
    border: `2px solid ${colors.blueText}`,
    background: colors.blueSoft,
    color: colors.blueText,
  },
  pendiente: {
    ...pill,
    border: `2px solid ${colors.warningText}`,
    background: colors.warningSoft,
    color: colors.warningText,
  },
  reembolso: { ...pill, border: borders.quiet, background: colors.gray100, color: colors.gray600 },
});

export const acciones = style({
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gridArea: 'acciones',
  '@media': { '(max-width: 900px)': { justifyContent: 'flex-start' } },
});

export const accionNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const vacio = style({
  padding: '18px 0 14px',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const derecha = style({ textAlign: 'right' });
