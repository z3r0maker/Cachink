import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** «Compartir comprobante»: the preview, the phone and three ways out. */
export const preview = style({
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.gray100,
});

export const rule = style({ height: 2, background: colors.black });
export const row = style({ display: 'flex', alignItems: 'baseline', gap: 10 });

export const small = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const lineText = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

/** The option's one-line hint: 12 px semibold in ink. */
export const optionHint = style({
  display: 'block',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const lineAmount = style({
  flex: 'none',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const tel = style({
  width: '100%',
  height: 52,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5 } },
});

export const option = style([
  pressable,
  {
    boxSizing: 'content-box',
    minHeight: 62,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    textAlign: 'left',
    color: colors.black,
  },
]);

export const sent = style({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '14px 16px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.greenSoft,
});

/** The receipt's small coin: 26 px, a 2 px border and no shadow (unlike the shell's). */
export const coin = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 26,
  height: 26,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: 9999,
  background: colors.yellow,
  color: colors.black,
});
