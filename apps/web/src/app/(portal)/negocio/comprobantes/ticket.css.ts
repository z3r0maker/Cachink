import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/**
 * The «Ticket» preview: the same paper the caja shares by WhatsApp
 * (operador/caja/share-recibo), yellow, black and white, torn edges, mono.
 */
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

export const papel = style({
  width: 340,
  maxWidth: '100%',
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
  gap: 12,
  padding: '12px 18px',
  borderTop: borders.thin,
  borderBottom: borders.thin,
  background: colors.yellow,
});

export const logo = style({
  width: 40,
  height: 40,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: radii[0],
  border: borders.thin,
  background: colors.white,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
});

export const logoImg = style({ maxWidth: 34, maxHeight: 34, objectFit: 'contain' });

export const nombreBloque = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
});

export const negocio = style({
  fontSize: portalFontSizes.body,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  overflowWrap: 'anywhere',
});

export const direccion = style({
  fontSize: portalFontSizes.tag,
  lineHeight: 1.35,
  fontWeight: typography.weights.semibold,
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

export const unidad = style({ paddingLeft: 12, fontSize: portalFontSizes.tag });

/** The perforation between blocks, drawn as a pattern (not a border). */
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

export const pie = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 5,
  textAlign: 'center',
});

export const leyenda = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const whatsapp = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
});

export const fiscal = style({ fontSize: portalFontSizes.tag, lineHeight: 1.4 });

export const marca = style({
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
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
