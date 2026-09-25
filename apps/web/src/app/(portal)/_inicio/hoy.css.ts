import { style, styleVariants } from '@vanilla-extract/css';
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

import { pressable } from '../../../styles/press.css';

/** Hoy (ADR-107): Don Cuentas's briefing leads; everything else is read-only and quiet. */

export const hero = style({
  display: 'flex',
  minHeight: 236,
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[7],
  boxShadow: shadows.card,
  overflow: 'hidden',
  '@media': { 'screen and (max-width: 767px)': { flexDirection: 'column' } },
});

export const heroStage = style({
  flex: 'none',
  width: 260,
  display: 'grid',
  placeItems: 'end center',
  background: colors.yellow,
  borderRight: borders.thin,
  '@media': {
    'screen and (max-width: 767px)': {
      width: 'auto',
      height: 180,
      borderRight: 0,
      borderBottom: borders.thin,
    },
  },
});

export const heroBody = style({
  flex: 1,
  padding: '26px 30px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 10,
});

export const eyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const heroTitle = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
  color: colors.black,
});

export const heroLine = style({
  margin: 0,
  maxWidth: 680,
  fontSize: portalFontSizes.lgx,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const heroActions = style({ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 });

export const two = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
  gap: 20,
  '@media': { 'screen and (max-width: 1023px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

/** A read-only surface: quiet edge, no shadow (ADR-107). */
export const quiet = style({
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const cardHead = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });

export const cardLink = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const bigFigure = style({
  fontSize: portalFontSizes.displayLg,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
});

export const figureTone = styleVariants({
  pos: { color: colors.greenText },
  neg: { color: colors.redText },
  ink: { color: colors.black },
});

export const bars = style({
  display: 'grid',
  gridTemplateColumns: '86px minmax(0, 1fr) auto',
  gap: '10px 12px',
  alignItems: 'center',
});

export const barLabel = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const barTrack = style({
  position: 'relative',
  height: 16,
  overflow: 'hidden',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
});

export const barFill = styleVariants({
  ventas: { position: 'absolute', inset: '0 auto 0 0', background: colors.green },
  gastos: { position: 'absolute', inset: '0 auto 0 0', background: colors.red },
});

export const barValue = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
});

export const hoyGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
});

export const smallLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

/** Today's figures take the 36 step (S-5), one below the month's. */
export const midFigure = style({
  display: 'block',
  fontSize: portalFontSizes.pageTitle,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const pendRow = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 12px',
    borderRadius: radii[3],
    border: 0,
    boxShadow: 'none',
    color: colors.black,
    textDecoration: 'none',
    selectors: { '&:hover': { background: colors.offwhite } },
  },
]);

export const pendIcon = style({
  width: 40,
  height: 40,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[2],
});

export const pendTone = styleVariants({
  alerta: { background: colors.redSoft, color: colors.redText },
  sync: { background: colors.warningSoft, color: colors.warningText },
  gente: { background: colors.blueSoft, color: colors.blueText },
  paso: { background: colors.purpleSoft, color: colors.black },
});

export const pendTitle = style({
  display: 'block',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const pendSub = style({
  display: 'block',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const pendCta = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const count = style({
  padding: '2px 9px',
  borderRadius: shapeRadii.pill,
  background: colors.black,
  color: colors.yellow,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
});
