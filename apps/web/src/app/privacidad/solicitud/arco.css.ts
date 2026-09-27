import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** `/privacidad/solicitud` (N-34): the ARCO form and its receipt. */

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const etiqueta = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const etiquetaFila = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
});

export const contador = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const derechos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  '@media': { '(max-width: 599px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const derecho = style([
  pressable,
  {
    minHeight: 68,
    boxSizing: 'border-box',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    font: 'inherit',
    color: colors.black,
    background: colors.white,
    border: borders.quiet,
    borderRadius: radii[4],
    selectors: {
      '&:hover': { borderColor: colors.black },
      '&[data-state="checked"]': {
        background: colors.yellowSoft,
        border: borders.thin,
        boxShadow: shadows.small,
      },
      '&:focus-visible': { outline: `3px solid ${colors.black}`, outlineOffset: 2 },
    },
  },
]);

/** The odd fifth right spans the row. */
export const ancha = style({ gridColumn: '1 / -1' });

export const derechoIcono = style({
  width: 40,
  height: 40,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[2],
  background: colors.gray100,
  color: colors.gray600,
  selectors: {
    [`${derecho}[data-state="checked"] &`]: {
      background: colors.yellow,
      color: colors.black,
      boxShadow: `inset 0 0 0 2px ${colors.black}`,
    },
  },
});

export const derechoTexto = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const derechoTitulo = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const derechoCuerpo = style({
  fontSize: portalFontSizes.sm,
  lineHeight: 1.35,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const texto = style({
  width: '100%',
  minHeight: 96,
  boxSizing: 'border-box',
  padding: '12px 14px',
  resize: 'vertical',
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  background: colors.offwhite,
  border: borders.thin,
  borderRadius: radii[2],
  selectors: {
    '&:focus': { borderWidth: 2.5, outline: 'none', background: colors.white },
    '&::placeholder': { color: colors.textMuted },
  },
});

/** «Para proteger tus datos…»: blue, it is information, not a warning. */
export const identidad = style({
  margin: 0,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.blueSoft,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const identidadIcono = style({ color: colors.blueText, flex: 'none', marginTop: 1 });

export const enviar = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
});

export const faltaIzq = style({
  margin: 0,
  flex: 1,
  minWidth: 180,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const enlace = style({ color: colors.black, fontWeight: typography.weights.extraBold });

/* The receipt. */

export const okCabeza = style({ display: 'flex', alignItems: 'center', gap: 14 });

export const okSello = style({
  width: 52,
  height: 52,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.green,
  border: borders.thick,
  color: colors.black,
});

export const okTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const okTexto = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

/** The folio is a 31-character ULID: it gets the full row, the deadline under it. */
export const fichas = style({ display: 'grid', gap: 12 });

const ficha = {
  padding: '16px 18px',
  borderRadius: radii[4],
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
} as const;

export const fichaFolio = style({ ...ficha, background: colors.yellowSoft, border: borders.thin });

export const fichaPlazo = style({ ...ficha, background: colors.offwhite, border: borders.quiet });

export const folio = style({
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'anywhere',
  color: colors.black,
});

export const plazo = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const fichaPie = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const aparte = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
