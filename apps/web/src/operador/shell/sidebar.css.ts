import { style } from '@vanilla-extract/css';
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

/**
 * The register's sidebar in El Mostrador (ADR-107): the caja it is, the
 * menu in three groups, and a card for whoever holds the turno.
 */
export const cajaPill = style({
  margin: '14px 12px 0',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 56,
  padding: '0 12px',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const cajaTile = style({
  flex: 'none',
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[0],
  background: colors.black,
  color: colors.yellow,
});

export const cajaText = style({ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 });

export const cajaName = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const cajaSub = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const cajaDot = style({
  flex: 'none',
  width: 10,
  height: 10,
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  background: colors.gray400,
  selectors: { '&[data-abierto]': { background: colors.green } },
});

export const groupLabel = style({
  padding: '12px 12px 4px',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const card = style({
  margin: '0 12px 14px',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.yellowSoft,
});

export const cardSinTurno = style({ background: colors.white });

export const cardActions = style({ display: 'flex', gap: 8 });

const cardButton = {
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  textDecoration: 'none',
} as const;

export const lock = style([
  pressable,
  { ...cardButton, flex: 'none', width: 44, background: colors.white, color: colors.black },
]);

export const close = style([
  pressable,
  {
    ...cardButton,
    flex: 1,
    background: colors.black,
    color: colors.white,
    boxShadow: shadows.pressed,
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
  },
]);
