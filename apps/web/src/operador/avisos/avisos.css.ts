import { style } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Operador · Avisos, from `Xangarro Portal - Operador Avisos.dc.html`. */
const contentBox = { boxSizing: 'content-box' } as const;

export const h1 = style({
  margin: 0,
  fontSize: fontSizes.xl5,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

export const sub = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const list = style({ display: 'flex', flexDirection: 'column', gap: 14 });

export const card = style({
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.white,
  boxShadow: shadows.card,
  selectors: { '&[data-read]': { border: `2px solid ${colors.gray200}` } },
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '14px 18px',
  borderBottom: `2px solid ${colors.black}`,
});

export const headIcon = style({
  ...contentBox,
  flex: 'none',
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: denseRadii.r11,
  background: colors.white,
  color: colors.black,
});

export const kind = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const unread = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 9px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const time = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
});

export const body = style({ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 });

export const title = style({
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  textWrap: 'pretty',
});

export const text = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const buttons = style({ display: 'flex', gap: 10, flexWrap: 'wrap' });

const button = {
  height: 50,
  borderRadius: denseRadii.r13,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.black,
  textDecoration: 'none',
} as const;

export const send = style([
  pressable,
  { ...button, padding: '0 20px', border: `2.5px solid ${colors.black}`, boxShadow: shadows.card },
]);

export const link = style([
  pressable,
  {
    ...button,
    ...contentBox,
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 20px',
    border: `2px solid ${colors.black}`,
    background: colors.white,
    boxShadow: shadows.small,
  },
]);

export const markRead = style([
  pressable,
  {
    ...button,
    padding: '0 18px',
    border: `2px solid ${colors.black}`,
    background: colors.gray100,
    boxShadow: shadows.small,
  },
]);
