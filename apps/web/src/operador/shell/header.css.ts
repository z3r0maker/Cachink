import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from './shell.css';

const contentBox = { boxSizing: 'content-box' } as const;

export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 30,
  minHeight: 76,
  padding: '12px 32px',
  background: colors.gray200,
  borderBottom: `2.5px solid ${colors.black}`,
  '@media': {
    [PHONE]: {
      minHeight: 64,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      background: colors.white,
      borderBottom: borders.quiet,
    },
  },
});

export const inner = style({
  maxWidth: 1760,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  '@media': { [PHONE]: { width: '100%', gap: 8, flexWrap: 'nowrap' } },
});

export const bizPill = style({
  '@media': { 'screen and (min-width: 760px)': { display: 'none' } },
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

export const bizTile = style({
  flex: 'none',
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[1],
  background: colors.black,
  color: colors.yellow,
});

export const bizText = style({ display: 'flex', flexDirection: 'column', minWidth: 0 });

export const bizName = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  lineHeight: 1.2,
  color: colors.black,
});

export const bizSub = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const right = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  '@media': { [PHONE]: { gap: 8, flexWrap: 'nowrap' } },
});

/** Screens' header actions: on a phone the tab bar already carries Cobrar. */
export const actionSlot = style({
  display: 'contents',
  '@media': { [PHONE]: { display: 'none' } },
});

/** Shared by the linked pill (main screens) and the static one (Pendientes, Cierre). */
export const syncBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  padding: '7px 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  color: colors.black,
  textDecoration: 'none',
  background: colors.greenSoft,
  selectors: { '&[data-offline]': { background: colors.warningSoft } },
  '@media': { [PHONE]: { padding: '5px 10px', gap: 6 } },
} as const;

export const syncPill = style([pressable, syncBase]);
export const syncStatic = style(syncBase);

export const syncDot = style({
  ...contentBox,
  flex: 'none',
  width: 11,
  height: 11,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.green,
  selectors: { '[data-offline] &': { background: colors.warning } },
});

export const syncLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.black,
  whiteSpace: 'nowrap',
  '@media': { [PHONE]: { display: 'none' } },
});

export const syncCorto = style([
  syncLabel,
  {
    display: 'none',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.extraBold,
    '@media': { [PHONE]: { display: 'inline' } },
  },
]);

export const bell = style([
  pressable,
  {
    ...contentBox,
    position: 'relative',
    flex: 'none',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    boxShadow: shadows.small,
    color: colors.black,
  },
]);

export const bellCount = style({
  position: 'absolute',
  top: -7,
  right: -7,
  minWidth: 22,
  height: 22,
  padding: '0 5px',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

/** The per-screen yellow action («Nueva venta», «Registrar gasto»). */
export const action = style([
  pressable,
  {
    ...contentBox,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    height: 44,
    padding: '0 16px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
    textDecoration: 'none',
    selectors: { '&:hover': { background: colors.yellowDeep } },
  },
]);

export const fecha = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  '@media': { [PHONE]: { display: 'none' } },
});
