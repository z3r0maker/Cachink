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

/** CfgPlan's top row: the yellow plan hero, «Tu consumo este mes» and «Tu plan incluye». */
export const fila = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))',
  gap: 16,
});

const tarjeta = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
} as const;

export const hero = style({ ...tarjeta, gap: 4, padding: '18px 20px', background: colors.yellow });

export const panel = style({ ...tarjeta, gap: 10, padding: '16px 20px', background: colors.white });

export const heroTop = style({ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' });

export const heroEyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.black,
});

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginLeft: 'auto',
  padding: '3px 10px',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
} as const;

/** The status tag: always the word, the colour only backs it up. */
export const tono = styleVariants({
  gratis: { ...pill, background: colors.white, color: colors.black },
  prueba: { ...pill, background: colors.blueSoft, color: colors.blueText },
  activo: { ...pill, background: colors.greenSoft, color: colors.greenText },
  atrasado: { ...pill, background: colors.warningSoft, color: colors.warningText },
  vencido: { ...pill, background: colors.redSoft, color: colors.redText },
});

export const planNombre = style({
  margin: 0,
  fontSize: portalFontSizes.display,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
});

export const precio = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const estadoLinea = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 2,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const heroAcciones = style({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 'auto',
  paddingTop: 12,
});

export const heroBoton = style({ flex: '1 1 140px', display: 'flex', flexDirection: 'column' });

export const metrica = style({ display: 'flex', flexDirection: 'column', gap: 5 });

export const metricaHead = style({ display: 'flex', alignItems: 'baseline', gap: 8 });

export const metricaNombre = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const metricaCifra = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const metricaDe = style({
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const alTope = style({
  padding: '1px 7px',
  border: `2px solid ${colors.warningText}`,
  borderRadius: shapeRadii.pill,
  background: colors.warningSoft,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.warningText,
});

export const barra = style({
  height: 8,
  overflow: 'hidden',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
});

export const barraLlena = styleVariants({
  normal: {
    display: 'block',
    height: '100%',
    background: colors.yellow,
    borderRight: borders.thin,
  },
  tope: { display: 'block', height: '100%', background: colors.warning, borderRight: borders.thin },
});

export const incluyeNota = style({
  margin: '-6px 0 0',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const incluyeLista = style({ margin: 0, padding: 0, listStyle: 'none' });

export const incluyeFila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 38,
  borderBottom: `2px solid ${colors.gray100}`,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const check = style({ display: 'flex', flex: 'none', color: colors.greenText });

export const incluyeNo = style({
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const desde = style({
  marginLeft: 'auto',
  padding: '2px 8px',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
});
