import { style, styleVariants } from '@vanilla-extract/css';
import { colors, fontSizes, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The big «$ 0.00» field: Cobrar · efectivo (64 px), Registrar gasto and Revisión de caja's limit (62 px). */
export const box = style({
  boxSizing: 'content-box',
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
});

export const boxSize = styleVariants({
  caja: { height: 64 },
  gasto: { height: 62 },
  limite: { height: 62 },
});

export const peso = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  color: colors.gray400,
});

const input = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
} as const;

export const field = styleVariants({
  caja: {
    ...input,
    fontSize: portalFontSizes.xl5,
    letterSpacing: typography.letterSpacing.tight,
  },
  gasto: { ...input, fontSize: fontSizes.xl4 },
  limite: { ...input, fontSize: portalFontSizes.xl4 },
});
