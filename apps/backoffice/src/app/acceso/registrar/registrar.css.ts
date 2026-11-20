import { style } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Board CD-20b: who the link is for, and the passkey just saved. */
export const intro = style({
  margin: 0,
  fontSize: fontSizes.md,
  lineHeight: 1.5,
  color: colors.ink,
});

export const para = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const inicial = style({
  flex: 'none',
  width: 40,
  height: 40,
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  background: colors.yellow,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const paraTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: fontSizes.md,
  color: colors.ink,
});

export const paraNota = style({
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const listaFila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: fontSizes.md,
  color: colors.greenText,
});
