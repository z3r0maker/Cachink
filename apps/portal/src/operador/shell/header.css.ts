import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

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
  '@media': { [PHONE]: { padding: '12px 16px' } },
});

export const inner = style({
  maxWidth: 1760,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
});

export const bizPill = style({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '6px 12px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
  boxShadow: shadows.small,
});

export const bizTile = style({
  ...contentBox,
  flex: 'none',
  width: 30,
  height: 30,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.yellow,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const bizName = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  lineHeight: 1.15,
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const bizSub = style({
  marginTop: 1,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const right = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
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
});

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

/** A white header action (Avisos' «Marcar todo como leído»): a native button, 44 px. */
export const plainAction = style([
  pressable,
  {
    height: 44,
    padding: '0 16px',
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.black,
  },
]);
