import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, shapeRadii, typography } from '@xangarro/tokens';

/**
 * The comprobante as the customer gets it (OpComprobante): a paper ticket in
 * the brand's yellow, black and white, with torn edges and a mono face.
 */
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

export const papel = style({
  display: 'flex',
  flexDirection: 'column',
  filter: `drop-shadow(1px 0 0 ${colors.black}) drop-shadow(-1px 0 0 ${colors.black}) drop-shadow(0 1px 0 ${colors.black}) drop-shadow(0 -1px 0 ${colors.black}) drop-shadow(4px 4px 0 ${colors.black})`,
});

export const borde = style({ display: 'block', width: '100%', height: 8, fill: colors.white });

export const hoja = style({
  paddingBottom: 14,
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  fontFamily: MONO,
  color: colors.black,
});

export const banda = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 18px',
  borderTop: borders.thin,
  borderBottom: borders.thin,
  background: colors.yellow,
});

export const moneda = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.black,
});

export const negocio = style({
  fontSize: portalFontSizes.body,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
});

export const filas = style({
  padding: '12px 18px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
  fontSize: portalFontSizes.xs,
  lineHeight: 1.3,
  fontWeight: typography.weights.semibold,
});

export const fila = style({
  display: 'flex',
  alignItems: 'baseline',
  selectors: { '&[data-fuerte]': { fontWeight: typography.weights.extraBold } },
});

export const mayus = style({ textTransform: 'uppercase' });

/** The dotted leader between a label and its value. */
export const puntos = style({
  flex: 1,
  minWidth: 10,
  height: 2,
  margin: '0 6px',
  alignSelf: 'center',
  backgroundImage: `radial-gradient(circle, ${colors.black} 1px, transparent 1.3px)`,
  backgroundSize: '5px 2px',
  backgroundRepeat: 'repeat-x',
});

/** The perforation between the receipt's blocks, drawn as a pattern (not a border). */
export const corte = style({
  height: 2,
  margin: '2px 0',
  backgroundImage: `linear-gradient(90deg, ${colors.black} 60%, transparent 60%)`,
  backgroundSize: '8px 2px',
});

export const total = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '2px 0',
  padding: '7px 10px',
  border: borders.thin,
  background: colors.yellow,
});

export const totalLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.08em',
});

export const totalValor = style({
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
});

export const centro = style({
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const marca = style({
  fontSize: portalFontSizes.tag,
  letterSpacing: '0.04em',
});

export const monedita = style({
  boxSizing: 'border-box',
  width: 14,
  height: 14,
  display: 'inline-grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
});
