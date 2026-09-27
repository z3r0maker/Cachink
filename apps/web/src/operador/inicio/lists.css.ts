import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Inicio's side column: the owner's messages and the last cortes. */
/* De parte de Pedro ------------------------------------------------------ */

export const mensajes = style({ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 });

export const mensaje = style({
  display: 'flex',
  gap: 10,
  padding: '10px 12px',
  border: '2px solid transparent',
  borderRadius: radii[3],
  color: colors.ink,
  textDecoration: 'none',
  selectors: { '&:hover': { background: colors.gray100 } },
});

export const mensajeAlta = style({
  background: colors.redSoft,
  borderColor: colors.redText,
  selectors: { '&:hover': { background: colors.redSoft } },
});

export const dot = styleVariants({
  alta: { background: colors.redText },
  normal: { background: colors.yellow, border: borders.thin },
});

export const dotBase = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 10,
  height: 10,
  marginTop: 6,
  borderRadius: shapeRadii.pill,
});

export const mensajeText = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });

export const mensajeHora = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
  selectors: { '&[data-alta]': { color: colors.redText } },
});

/* Tus últimos cortes ------------------------------------------------------ */

export const cortes = style({ padding: '4px 18px 8px', display: 'flex', flexDirection: 'column' });

export const corte = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 36,
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const corteFecha = style({
  flex: 1,
  minWidth: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});
