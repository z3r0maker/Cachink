import { keyframes, style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

const pop = keyframes({
  from: { opacity: 0, transform: 'translateY(10px) scale(0.98)' },
  to: { opacity: 1, transform: 'none' },
});

/**
 * The quick notice every operator screen shows after an action (OpEstados
 * «Aviso rápido»): tinted head with the icon, the title and the X; the detail
 * below. The X or Esc closes it.
 */
export const toast = style({
  position: 'fixed',
  right: 32,
  bottom: 32,
  zIndex: 70,
  width: 'min(380px, calc(100vw - 32px))',
  overflow: 'hidden',
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.white,
  boxShadow: shadows.card,
  animation: `${pop} 220ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': {
    [PHONE]: { right: 16, bottom: 84 },
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 52,
  padding: '4px 14px',
  borderBottom: borders.thin,
});

export const icon = style({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
});

export const title = style({
  flex: 1,
  minWidth: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.3,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const close = style([
  pressable,
  {
    width: 44,
    height: 44,
    flex: 'none',
    marginRight: -10,
    display: 'grid',
    placeItems: 'center',
    border: 'none',
    borderRadius: radii[1],
    background: 'none',
    color: colors.black,
  },
]);

export const body = style({
  margin: 0,
  padding: '12px 14px 14px',
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
  textWrap: 'pretty',
});
