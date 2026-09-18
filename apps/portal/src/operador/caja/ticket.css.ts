import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';
import { NARROW } from './catalogo.css';

/**
 * The ticket. Wide: a 392 px column pinned under the header, its list
 * scrolling and the total + COBRAR anchored at the foot. Narrow (< 1240 px):
 * a yellow bar and a bottom sheet (README «Banda intermedia»).
 */
export const panel = style({
  flex: 'none',
  width: 392,
  alignSelf: 'flex-start',
  position: 'sticky',
  top: 98,
  height: 'calc(100vh - 124px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.hero,
  '@media': {
    [NARROW]: {
      display: 'none',
      position: 'fixed',
      width: 'auto',
      height: 'auto',
      top: 'auto',
      left: 272,
      right: 24,
      bottom: 20,
      maxWidth: 560,
      margin: '0 auto',
      maxHeight: '74vh',
      zIndex: 50,
      selectors: { '&[data-open]': { display: 'flex' } },
    },
    [PHONE]: { left: 8, right: 8, bottom: 80 },
  },
});

export const head = style({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  borderBottom: `2.5px solid ${colors.black}`,
  background: colors.gray100,
});

export const count = style({
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const closeSheet = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 32,
  height: 32,
  display: 'none',
  placeItems: 'center',
  padding: 0,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.white,
  cursor: 'pointer',
  '@media': { [NARROW]: { display: 'grid' } },
});

export const list = style({ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 0' });

export const line = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
});

export const steppers = style({ flex: 'none', display: 'flex', alignItems: 'center', gap: 6 });

export const step = style([
  pressable,
  {
    boxSizing: 'content-box',
    width: 36,
    height: 36,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[1],
    background: colors.white,
    boxShadow: `2px 2px 0 ${colors.black}`,
    selectors: { '&[data-plus]': { background: colors.yellow } },
  },
]);

export const qty = style({
  minWidth: 28,
  textAlign: 'center',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const amount = style({
  flex: 'none',
  minWidth: 78,
  textAlign: 'right',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const foot = style({
  flex: 'none',
  padding: '16px 18px 18px',
  borderTop: `2.5px solid ${colors.black}`,
  background: colors.white,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});

export const totalRow = style({ display: 'flex', alignItems: 'baseline', gap: 12 });

export const totalValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.total,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const lineName = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.015em',
  color: colors.black,
  textWrap: 'pretty',
});

export const lineEach = style({
  marginTop: 2,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
