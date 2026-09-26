import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../styles/press.css';
import { aside, wide } from './sidebar.css';

/**
 * `wide` alone lost to `card`'s `display: flex` (declared later, same
 * specificity), so the cards overflowed the rail. They hide themselves.
 */
const soloAncho = {
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
  selectors: { [`${aside}[data-rail="true"] &`]: { display: 'none' } },
} as const;

/** The sidebar's cards and Don Cuentas's face (ADR-107). */

/** Don Cuentas's face in place of an icon: his standing pose, cropped to the head. */
export const face = style({
  position: 'relative',
  width: 24,
  height: 24,
  flex: 'none',
  overflow: 'hidden',
  borderRadius: shapeRadii.pill,
  border: `2px solid ${colors.black}`,
  background: colors.yellow,
});

export const faceImg = style({ position: 'absolute', width: 40, height: 40, left: -9, top: -3 });

const card = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 12,
  borderRadius: radii[4],
  textDecoration: 'none',
  color: colors.black,
} as const;

/** «Primeros pasos» until setup is complete (ADR-107). */
export const pasosCard = style([
  pressable,
  wide,
  card,
  {
    margin: '12px 12px 0',
    background: colors.yellowSoft,
    border: `2px solid ${colors.black}`,
    boxShadow: shadows.small,
    ...soloAncho,
  },
]);

export const cardTitle = style({
  display: 'block',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const cardSub = style({
  display: 'block',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const ring = style({ flex: 'none' });

/** Help, one tap away from every screen: Don Cuentas with his book. */
export const ayudaCard = style([
  pressable,
  wide,
  card,
  {
    margin: '0 12px 8px',
    background: colors.offwhite,
    border: borders.quiet,
    ...soloAncho,
  },
]);

export const ayudaImg = style({
  width: 40,
  height: 40,
  flex: 'none',
  padding: 2,
  boxSizing: 'border-box',
  borderRadius: radii[2],
  border: `2px solid ${colors.black}`,
  background: colors.yellow,
  objectFit: 'contain',
});

export const privacy = style([
  wide,
  {
    padding: '0 24px 10px',
    fontSize: fontSizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.gray600,
  },
]);

/** The rail's help: only Don Cuentas's face, shown exactly where the card hides. */
export const ayudaRail = style({
  display: 'none',
  justifyContent: 'center',
  margin: '0 0 8px',
  '@media': { 'screen and (max-width: 1023px)': { display: 'flex' } },
  selectors: { [`${aside}[data-rail="true"] &`]: { display: 'flex' } },
});
