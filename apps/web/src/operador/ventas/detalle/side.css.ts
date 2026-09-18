import { style } from '@vanilla-extract/css';
import { colors, denseRadii, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../../styles/press.css';

/** Detalle de venta's right column: the trace, the two actions, the fiado card. */
export const column = style({ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 });

export const cardHead = style({
  padding: '14px 18px',
  background: colors.gray100,
  borderBottom: `2.5px solid ${colors.black}`,
});

export const cardBody = style({
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
});

export const traza = style({ display: 'flex', alignItems: 'baseline', gap: 10 });

export const trazaLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const trazaValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textAlign: 'right',
  textWrap: 'pretty',
});

const action = {
  borderRadius: denseRadii.r13,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.black,
  cursor: 'pointer',
} as const;

export const share = style([
  pressable,
  {
    ...action,
    height: 54,
    border: `2.5px solid ${colors.black}`,
    background: colors.yellow,
    boxShadow: shadows.card,
    selectors: { '&:hover': { background: colors.yellowDeep } },
  },
]);

export const cancel = style([
  pressable,
  {
    ...action,
    height: 54,
    border: `2px solid ${colors.black}`,
    background: colors.redSoft,
    boxShadow: shadows.small,
    selectors: {
      '&:disabled': { background: colors.gray100, cursor: 'not-allowed', opacity: 0.5 },
    },
  },
]);

export const hint = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const fiado = style({
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.warningSoft,
  boxShadow: shadows.hero,
});

export const cliente = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const fiadoText = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const abono = style([
  pressable,
  {
    ...action,
    boxSizing: 'content-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    border: `2px solid ${colors.black}`,
    background: colors.white,
    boxShadow: shadows.small,
    textDecoration: 'none',
  },
]);

export const intro = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});
