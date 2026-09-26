import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/** The header's «Buscar o ir a…» trigger. */
export const trigger = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: 340,
    height: 44,
    padding: '0 12px',
    background: colors.white,
    border: borders.quiet,
    borderRadius: radii[2],
    boxShadow: 'none',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    '@media': {
      'screen and (max-width: 1023px)': { width: 44, padding: 0, justifyContent: 'center' },
    },
  },
]);

export const triggerText = style({
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
});

export const kbd = style({
  marginLeft: 'auto',
  padding: '1px 7px',
  border: borders.quiet,
  borderRadius: radii[0],
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
});

export const overlay = style({ position: 'fixed', inset: 0, background: colors.scrim, zIndex: 60 });

export const panel = style({
  position: 'fixed',
  top: '14vh',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(560px, calc(100vw - 32px))',
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
  zIndex: 61,
  overflow: 'hidden',
});

export const input = style({
  width: '100%',
  height: 58,
  boxSizing: 'border-box',
  padding: '0 18px',
  border: 0,
  borderBottom: borders.quiet,
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.bold,
});

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 8,
  maxHeight: 360,
  overflowY: 'auto',
});

export const option = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 44,
  padding: '0 12px',
  borderRadius: radii[2],
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
  cursor: 'pointer',
  selectors: { '&[aria-selected="true"]': { background: colors.yellowSoft } },
});

export const group = style({ marginLeft: 'auto', fontSize: fontSizes.xs, color: colors.gray600 });

export const empty = style({
  padding: '14px 12px',
  fontSize: portalFontSizes.md,
  color: colors.gray600,
});
