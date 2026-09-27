import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

const TABULAR = 'tabular-nums';

/** Clásico, Moderno and Minimal previews (CfgComprobantes): one sheet, three dresses. */
const hoja = style({
  width: 420,
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  color: colors.black,
});

export const papel = styleVariants({
  clasico: [
    hoja,
    {
      border: borders.thick,
      borderRadius: radii[0],
      boxShadow: shadows.hero,
      padding: '22px 26px',
    },
  ],
  moderno: [
    hoja,
    { border: borders.quiet, borderRadius: radii[6], overflow: 'hidden', paddingBottom: 20 },
  ],
  minimal: [hoja, { border: borders.quiet, borderRadius: radii[2], padding: '28px 30px' }],
});

const cabeza = style({ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6 });

export const cabezaVariante = styleVariants({
  clasico: [cabeza, { alignItems: 'center', textAlign: 'center' }],
  minimal: [cabeza, { alignItems: 'flex-start' }],
});

export const banda = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '18px 22px',
});

export const logo = style({
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  border: borders.thin,
  fontWeight: typography.weights.extraBold,
});

export const logoTam = styleVariants({
  clasico: { width: 54, height: 54, borderRadius: radii[2], fontSize: portalFontSizes.cardTitle },
  moderno: {
    width: 46,
    height: 46,
    borderRadius: radii[2],
    fontSize: portalFontSizes.lgx,
    background: colors.white,
  },
});

export const logoImg = style({ maxWidth: '86%', maxHeight: '86%', objectFit: 'contain' });

export const nombre = styleVariants({
  clasico: {
    fontSize: portalFontSizes.xl2,
    fontWeight: typography.weights.extraBold,
    letterSpacing: typography.letterSpacing.tight,
  },
  moderno: {
    fontSize: portalFontSizes.xl,
    fontWeight: typography.weights.extraBold,
    letterSpacing: typography.letterSpacing.tight,
  },
  minimal: {
    fontSize: portalFontSizes.sectionTitle,
    fontWeight: typography.weights.extraBold,
    letterSpacing: typography.letterSpacing.tight,
  },
});

export const direccion = style({
  fontSize: portalFontSizes.xs,
  lineHeight: 1.35,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const cuerpo = style({ display: 'flex', flexDirection: 'column', gap: 11 });

export const cuerpoModerno = style({ padding: '4px 22px 0' });

export const linea = styleVariants({
  clasico: { borderColor: colors.black },
  moderno: { borderColor: colors.gray200 },
  minimal: { borderColor: colors.gray200 },
});

export const folio = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 10,
  paddingTop: 10,
  borderTopWidth: 2,
  borderTopStyle: 'solid',
});

export const mini = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.1em',
  color: colors.gray600,
});

export const num = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
});

export const fecha = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textAlign: 'right',
  fontVariantNumeric: TABULAR,
});

export const tabla = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 34px 74px',
  gap: 6,
  alignItems: 'center',
  padding: '8px 0',
  borderBottomWidth: 2,
  borderBottomStyle: 'solid',
});

export const concepto = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const derecha = style({ textAlign: 'right' });

export const centro = style({ textAlign: 'center' });

export const total = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
});

export const totalVariante = styleVariants({
  clasico: { border: borders.thin },
  moderno: { background: colors.offwhite, borderRadius: `0 ${radii[2]}px ${radii[2]}px 0` },
  minimal: { padding: '4px 0' },
});

export const totalValor = styleVariants({
  clasico: {
    fontSize: portalFontSizes.xl4,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: TABULAR,
  },
  moderno: {
    fontSize: portalFontSizes.xl5,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: TABULAR,
  },
  minimal: {
    fontSize: portalFontSizes.xl4,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: TABULAR,
  },
});

export const pago = styleVariants({
  clasico: {
    padding: '3px 12px',
    borderRadius: shapeRadii.pill,
    border: borders.thin,
    background: colors.yellowSoft,
  },
  moderno: { padding: '4px 12px', borderRadius: shapeRadii.pill, background: colors.gray100 },
  minimal: {},
});

export const pagoTexto = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
});
