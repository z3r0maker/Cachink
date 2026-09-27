import { style, styleVariants } from '@vanilla-extract/css';
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

/** «Lo primero»: one card, one action; its tone follows the situation. */
export const hero = style({
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  flexWrap: 'wrap',
  padding: '18px 22px 18px 24px',
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
  '@media': { [PHONE]: { padding: 18, gap: 14 } },
});

export const heroTono = styleVariants({
  listo: { background: colors.yellow },
  cerrado: { background: colors.white },
  cerrar: { background: colors.warningSoft },
  aclarar: { background: colors.redSoft },
  offline: { background: colors.gray100 },
});

export const tile = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 56,
  height: 56,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[4],
});

export const tileTono = styleVariants({
  listo: { background: colors.white, color: colors.black },
  cerrado: { background: colors.yellowSoft, color: colors.black },
  cerrar: { background: colors.yellow, color: colors.black },
  aclarar: { background: colors.white, color: colors.redText, borderColor: colors.redText },
  offline: {
    background: colors.warningSoft,
    color: colors.warningText,
    borderColor: colors.warningText,
  },
});

export const text = style({
  flex: '1 1 320px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const eyebrowRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export const eyebrowTono = styleVariants({
  listo: { color: colors.ink },
  cerrado: { color: colors.textMuted },
  cerrar: { color: colors.warningText },
  aclarar: { color: colors.redText },
  offline: { color: colors.warningText },
});

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'pretty',
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl3 } },
});

export const body = style({
  margin: 0,
  lineHeight: 1.45,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const side = style({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 8,
  '@media': { [PHONE]: { flex: '1 1 100%', alignItems: 'stretch' } },
});

export const cta = style([
  pressable,
  {
    height: 64,
    padding: '0 30px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    border: borders.thick,
    borderRadius: radii[5],
    fontSize: portalFontSizes.xl3,
    fontWeight: typography.weights.extraBold,
    letterSpacing: typography.letterSpacing.tight,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    '@media': { [PHONE]: { height: 56, fontSize: portalFontSizes.cardTitle } },
  },
]);

/** Black on yellow for «Cobrar»; yellow for the rest; white when it is only a look. */
export const ctaTono = styleVariants({
  negro: {
    background: colors.black,
    color: colors.yellow,
    boxShadow: `4px 4px 0 ${colors.white}`,
  },
  amarillo: { background: colors.yellow, color: colors.black, boxShadow: shadows.card },
  blanco: { background: colors.white, color: colors.black, boxShadow: shadows.card },
});

export const nota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  fontVariantNumeric: 'tabular-nums',
});

export const notaFigure = style({ color: colors.black, fontWeight: typography.weights.extraBold });

export const extra = style({
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const chip = style({
  height: 30,
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: `2px solid ${colors.warningText}`,
  borderRadius: shapeRadii.pill,
  background: colors.warningSoft,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.warningText,
});

export const chipDot = style({
  width: 8,
  height: 8,
  borderRadius: shapeRadii.pill,
  background: colors.warning,
});

/** The situations' action: a step smaller than «Cobrar» (60 px, 20 px type). */
export const ctaMid = style({
  height: 60,
  padding: '0 28px',
  gap: 10,
  fontSize: portalFontSizes.cardTitle,
});
