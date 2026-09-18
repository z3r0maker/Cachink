import { style } from '@vanilla-extract/css';
import { colors, fontSizes, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The review modal's fields and boxes (`Revision de caja.dc.html`). */
const campo = {
  width: '100%',
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5 } },
} as const;

export const dinero = style({ ...campo, height: 54, fontSize: portalFontSizes.cardTitle });
export const numero = style({ ...campo, height: 50, fontSize: fontSizes.xl });
export const texto = style({
  ...campo,
  height: 50,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.bold,
});

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
});

export const capturado = style({
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.gray100,
});

export const capturadoTexto = style({
  marginTop: 5,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const fila = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.gray100,
  selectors: { '&[data-fuerte]': { borderWidth: 2.5 } },
});

export const figura = style({
  marginLeft: 'auto',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const debeLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const duplicado = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '14px 16px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.warningSoft,
});

export const duplicadoTexto = style({
  flex: 1,
  minWidth: 180,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});
