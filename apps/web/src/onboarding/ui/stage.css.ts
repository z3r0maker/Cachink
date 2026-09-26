import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
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

/** «Platícanos de ti» (ADR-107): Don Cuentas on the yellow side, the question on the other. */

export const page = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: colors.offwhite,
});

export const top = style({
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  minHeight: 72,
  padding: '0 32px',
  background: colors.white,
  borderBottom: borders.thin,
  '@media': {
    'screen and (max-width: 767px)': { padding: '10px 16px', flexWrap: 'wrap', gap: 10 },
  },
});

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
  color: colors.black,
});

export const wordmark = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: portalFontSizes.xl4,
  lineHeight: 1,
});

export const progress = style({
  flex: 1,
  maxWidth: 620,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const progressText = style({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const muted = style({ color: colors.gray600 });

export const segments = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(0, 1fr)',
  gap: 5,
});

export const segment = styleVariants({
  hecho: {
    height: 10,
    borderRadius: shapeRadii.pill,
    border: borders.thin,
    background: colors.black,
  },
  actual: {
    height: 10,
    borderRadius: shapeRadii.pill,
    border: borders.thin,
    background: colors.yellow,
  },
  falta: {
    height: 10,
    borderRadius: shapeRadii.pill,
    border: borders.thin,
    background: colors.white,
  },
});

export const body = style({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 400px) minmax(0, 1fr)',
  '@media': { 'screen and (max-width: 899px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const side = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 18,
  padding: '32px 28px',
  background: colors.yellow,
  borderRight: borders.thin,
  '@media': {
    'screen and (max-width: 899px)': {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: '16px 16px 0',
      borderRight: 0,
      borderBottom: borders.thin,
    },
  },
});

export const bubble = style({
  position: 'relative',
  alignSelf: 'stretch',
  padding: '18px 20px',
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[6],
  boxShadow: shadows.card,
  fontSize: portalFontSizes.lgx,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.black,
  '@media': {
    'screen and (max-width: 899px)': {
      flex: 1,
      alignSelf: 'center',
      fontSize: portalFontSizes.body,
    },
  },
});

/** The bubble's tail points down at Don; it covers the bubble's edge so there is no seam. */
export const tail = style({
  position: 'absolute',
  left: 'calc(50% - 15px)',
  bottom: -18,
  overflow: 'visible',
  '@media': { 'screen and (max-width: 899px)': { display: 'none' } },
});

/** Don is 300px on the side; on a phone he shrinks beside his bubble. */
export const donSlot = style({ flex: 'none' });

globalStyle(`${donSlot} > *`, {
  '@media': { 'screen and (max-width: 899px)': { maxWidth: 120, maxHeight: 120 } },
});

export const tailFill = style({ fill: colors.white });

export const tailLine = style({ fill: 'none', stroke: colors.black, strokeWidth: 2.5 });

export const main = style({
  padding: '48px 64px 36px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  '@media': { 'screen and (max-width: 767px)': { padding: '24px 16px 32px' } },
});

export const eyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const question = style({
  margin: 0,
  maxWidth: 760,
  fontSize: portalFontSizes.display,
  lineHeight: 1.08,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.035em',
  color: colors.black,
  textWrap: 'balance',
  '@media': { 'screen and (max-width: 767px)': { fontSize: portalFontSizes.xl5 } },
});

export const hint = style({
  margin: '-8px 0 0',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const answers = style({ maxWidth: 820 });

export const actions = style({
  marginTop: 'auto',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  paddingTop: 16,
});

export const push = style({ marginLeft: 'auto' });
