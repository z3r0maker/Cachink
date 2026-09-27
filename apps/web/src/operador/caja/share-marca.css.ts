import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The business's own marks on the caja's receipt (Mi negocio › Comprobantes). */
export const logo = style({
  width: 34,
  height: 34,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: radii[0],
  border: borders.thin,
  background: colors.white,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const logoImg = style({ maxWidth: 28, maxHeight: 28, objectFit: 'contain' });

export const nombreBloque = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
});

export const direccion = style({
  fontSize: portalFontSizes.tag,
  lineHeight: 1.35,
  fontWeight: typography.weights.semibold,
});

export const unidad = style({ paddingLeft: 12, fontSize: portalFontSizes.tag });

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
