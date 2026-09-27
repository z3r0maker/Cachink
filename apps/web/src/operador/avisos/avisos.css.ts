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
import { PHONE } from '../shell/shell.css';

/** Operador · Avisos (`OpAvisos.dc.html`, El Mostrador). */
export const head = style({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

export const marcarTodo = style({ marginLeft: 'auto' });

export const tabs = style({
  alignSelf: 'flex-start',
  display: 'flex',
  padding: 4,
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.white,
});

export const tab = style([
  pressable,
  {
    height: 44,
    padding: '0 18px',
    border: '2px solid transparent',
    borderRadius: radii[1],
    background: 'none',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.gray600,
    selectors: {
      '&[aria-selected="true"]': {
        borderColor: colors.black,
        background: colors.yellow,
        color: colors.black,
      },
    },
  },
]);

export const list = style({ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 16 });

export const listCaja = style([list, { gap: 12 }]);

/* A message from the owner ------------------------------------------------ */

export const card = style({
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const cardStrong = style({
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
});

export const strip = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: '11px 22px',
  borderBottom: borders.quiet,
  background: colors.offwhite,
  '@media': { [PHONE]: { padding: '10px 16px' } },
});

export const stripStrong = style({ borderBottom: borders.thin });

export const avatar = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  color: colors.black,
});

export const de = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const hora = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const body = style({
  padding: '18px 22px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  '@media': { [PHONE]: { padding: 16 } },
});

export const bodyRow = style({
  padding: '16px 22px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  '@media': { [PHONE]: { padding: 16 } },
});

export const texts = style({
  flex: '1 1 260px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

/** The texts of a full card, stacked (no flex basis in a column). */
export const textsCol = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  textWrap: 'pretty',
});

export const titleStrong = style({ fontSize: portalFontSizes.xl2 });

export const text = style({
  margin: 0,
  lineHeight: 1.5,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const textStrong = style({ color: colors.ink });

export const cifra = style({
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const actions = style({ display: 'flex', gap: 10, flexWrap: 'wrap' });

/* A notice from the register ------------------------------------------- */

export const sistema = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  padding: '16px 20px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': { [PHONE]: { padding: 16, gap: 12 } },
});

export const meta = style({ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' });

export const metaHora = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const sinLeer = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const sinLeerDot = style({
  boxSizing: 'border-box',
  width: 10,
  height: 10,
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
});

export const sistemaTitle = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const sistemaText = style({
  lineHeight: 1.45,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
