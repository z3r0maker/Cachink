import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

const CONTENT_BOX = 'content-box';

/** Cobrar · efectivo (amount, quick amounts, keypad, change) and · fiado (client list). */
export const label = style({
  display: 'block',
  marginBottom: 5,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const amountBox = style({
  height: 64,
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  boxSizing: CONTENT_BOX,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
});

export const peso = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  color: colors.gray400,
});

export const amountInput = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xl5,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.ink,
});

export const clear = style({
  boxSizing: CONTENT_BOX,
  flex: 'none',
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.gray100,
  cursor: 'pointer',
  color: colors.black,
});

export const quick = style({ display: 'flex', gap: 9, flexWrap: 'wrap' });

export const quickChip = style([
  pressable,
  {
    boxSizing: CONTENT_BOX,
    display: 'inline-flex',
    alignItems: 'center',
    height: 44,
    padding: '0 16px',
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
  },
]);

export const keypad = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
});

export const key = style([
  pressable,
  {
    boxSizing: CONTENT_BOX,
    height: 52,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    background: colors.white,
    boxShadow: `2px 2px 0 ${colors.black}`,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.cardTitle,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
    selectors: { '&[data-muted]': { background: colors.gray100 } },
  },
]);

export const change = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  padding: '14px 16px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
});

export const changeLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.black,
});

export const changeValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.total,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const clientes = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  maxHeight: 280,
  overflowY: 'auto',
});

export const cliente = style({
  boxSizing: CONTENT_BOX,
  minHeight: 58,
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  border: `2px solid ${colors.gray200}`,
  borderRadius: radii[3],
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  selectors: {
    '&[aria-pressed="true"]': {
      border: `2.5px solid ${colors.black}`,
      background: colors.yellowSoft,
    },
  },
});

export const nuevoCliente = style([
  pressable,
  {
    height: 50,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
  },
]);
