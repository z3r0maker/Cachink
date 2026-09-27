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

/** Mi negocio · Comprobantes (CfgComprobantes): controls left, live preview right. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 16 });

export const rejilla = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 500px',
  gap: 24,
  alignItems: 'start',
  '@media': { '(max-width: 1180px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const controles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  padding: '22px 24px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  '@media': { '(max-width: 520px)': { padding: '18px 16px' } },
});

export const bloque = style({
  margin: 0,
  padding: 0,
  border: 'none',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const rotulo = style({
  padding: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nota = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const notaMal = style([nota, { color: colors.redText }]);

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media': { '(max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 });

export const campoCabeza = style({ display: 'flex', alignItems: 'baseline', gap: 8 });

export const contador = style([
  nota,
  { marginLeft: 'auto', fontSize: portalFontSizes.xs, fontVariantNumeric: 'tabular-nums' },
]);

const cajaBase = style({
  height: 48,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  overflow: 'hidden',
  selectors: { '&:focus-within': { borderColor: colors.black } },
});

export const caja = cajaBase;

export const entrada = style({
  flex: 1,
  minWidth: 0,
  height: '100%',
  border: 'none',
  padding: '0 14px',
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.black,
  outline: 'none',
  selectors: { '&:disabled': { color: colors.gray600 } },
});

export const prefijo = style({
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  background: colors.offwhite,
  borderRight: borders.quiet,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  fontVariantNumeric: 'tabular-nums',
});

export const interruptor = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 44,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

/** The save bar: quiet when clean, yellow with a hard shadow when dirty. */
const barra = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  minHeight: 68,
  boxSizing: 'border-box',
  padding: '10px 12px 10px 20px',
  borderRadius: radii[5],
});

export const bar = styleVariants({
  limpia: [barra, { background: colors.white, border: borders.quiet }],
  // Only a dirty form follows the scroll: that is when the save must stay in reach.
  sucia: [
    barra,
    {
      position: 'sticky',
      bottom: 12,
      zIndex: 5,
      background: colors.yellowSoft,
      border: borders.thick,
      boxShadow: shadows.card,
    },
  ],
  mal: [barra, { background: colors.redSoft, border: `2px solid ${colors.redText}` }],
});

const puntoBase = style({ width: 10, height: 10, flex: 'none', borderRadius: shapeRadii.pill });

export const punto = styleVariants({
  limpia: [puntoBase, { background: colors.green }],
  sucia: [puntoBase, { background: colors.warning }],
  mal: [puntoBase, { background: colors.redText }],
});

export const barTexto = style({
  flex: 1,
  minWidth: 200,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const barBotones = style({ display: 'flex', gap: 10, flexWrap: 'wrap' });
