import { style } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

const TABULAR = 'tabular-nums';

/** Dueño · Cortes de turno (`Cortes de turno.dc.html`). */
export const miga = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

/**
 * The file draws this link blue on the page's gray (4.19:1, under AA's 4.5:1);
 * ink with its underline keeps it a link and readable.
 */
export const enlace = style({
  color: colors.ink,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  selectors: { '&:hover': { color: colors.black } },
});

export const titulo = style({
  margin: '8px 0 0',
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const subtitulo = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const avatar = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.015em',
  color: colors.black,
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 11px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  whiteSpace: 'nowrap',
  selectors: {
    '&[data-estado]': {
      padding: '3px 10px',
      fontSize: portalFontSizes.tag,
      fontWeight: typography.weights.bold,
    },
  },
});

/* Panel. */
export const seccion = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const grande = style({
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
});

export const cifra = style({
  fontSize: portalFontSizes.balance,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const linea = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const nota = style({
  padding: '16px 18px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.yellowSoft,
});

export const notaTexto = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const tabla = style({
  overflow: 'hidden',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
});

export const renglon = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '12px 15px',
  borderBottom: `2px solid ${colors.gray100}`,
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const valor = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
});

export const denoms = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: 9,
});

export const denom = style({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '9px 11px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.black,
});

export const evento = style({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '12px 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: denseRadii.r13,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const eventoValor = style({
  marginLeft: 'auto',
  flex: 'none',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
});
