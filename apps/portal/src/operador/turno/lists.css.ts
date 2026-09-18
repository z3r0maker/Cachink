import { style } from '@vanilla-extract/css';
import {
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

const contentBox = { boxSizing: 'content-box' } as const;

/** «Pendientes de registrar»: its head carries a clock tile before the label. */
export const clockTile = style({
  ...contentBox,
  flex: 'none',
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.white,
  color: colors.warningText,
});

export const headTitle = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
});

export const name = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.015em',
  color: colors.black,
  textWrap: 'pretty',
});

export const detail = style({
  marginTop: 2,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const due = style({
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 11px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
});

export const amount = style({
  flex: 'none',
  minWidth: 98,
  textAlign: 'right',
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const time = style({
  flex: 'none',
  minWidth: 56,
  textAlign: 'right',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const actions = style({ flex: 'none', display: 'flex', gap: 9 });

const rowButton = {
  ...contentBox,
  display: 'inline-flex',
  alignItems: 'center',
  height: 44,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  boxShadow: shadows.small,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.black,
  textDecoration: 'none',
} as const;

export const registrar = style([
  pressable,
  { ...rowButton, padding: '0 16px', background: colors.yellow },
]);
export const hoyNo = style([
  pressable,
  { ...rowButton, padding: '0 14px', background: colors.white },
]);

export const saldo = style({
  flex: 'none',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
});
