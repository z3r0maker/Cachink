import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Hazlo por mí» in the aside: head, request form, and the request's state. */
export const tarjeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '20px 22px 22px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
});

export const cabeza = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const cabezaTexto = style({ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 });

export const etiqueta = style({
  alignSelf: 'flex-start',
  padding: '3px 8px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const etiquetaTono = styleVariants({
  incluido: [etiqueta, { background: colors.greenSoft, color: colors.greenText }],
  pago: [etiqueta, { background: colors.warningSoft, color: colors.warningText }],
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const label = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

const entrada = {
  width: '100%',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.black,
  selectors: {
    '&:focus': { border: borders.thin, outline: `3px solid ${colors.yellow}`, outlineOffset: 2 },
  },
} as const;

export const input = style({ ...entrada, height: 48, padding: '0 14px' });

export const textarea = style({ ...entrada, padding: '12px 14px', resize: 'vertical' });

export const adjuntar = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 56,
  padding: '8px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  cursor: 'pointer',
  color: colors.black,
  selectors: {
    '&:hover': { border: borders.thin, background: colors.yellowSoft },
    '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 },
  },
});

export const adjuntarTexto = style({ display: 'flex', flexDirection: 'column', minWidth: 0 });

export const fuerte = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  overflowWrap: 'anywhere',
});

export const estado = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  borderRadius: radii[4],
  border: '2px solid currentColor',
});

export const estadoTono = styleVariants({
  revision: [estado, { background: colors.warningSoft, color: colors.warningText }],
  esperando_aprobacion: [estado, { background: colors.blueSoft, color: colors.blueText }],
  aplicada: [estado, { background: colors.greenSoft, color: colors.greenText }],
  rechazada: [estado, { background: colors.gray100, color: colors.gray600 }],
  expirada: [estado, { background: colors.gray100, color: colors.gray600 }],
});

export const chip = style({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: shapeRadii.pill,
  border: '2px solid currentColor',
  background: colors.white,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
});

export const chipPunto = style({
  width: 7,
  height: 7,
  borderRadius: shapeRadii.pill,
  background: 'currentColor',
});

export const estadoTexto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const botones = style({ display: 'flex', gap: 10, flexWrap: 'wrap' });
