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

/** Primeros pasos (ADR-107): progress and Don Cuentas up top, the steps as a path. */

export const hero = style({
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  padding: '22px 26px',
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[7],
  boxShadow: shadows.card,
});

export const heroText = style({
  flex: '1 1 320px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const eyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl6,
  lineHeight: 1.08,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.035em',
});

export const sub = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const ringText = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: portalFontSizes.xl6,
});

export const section = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const sectionHead = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const sectionTitle = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
});

export const chips = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 38,
  padding: '0 14px 0 8px',
  borderRadius: shapeRadii.pill,
  background: colors.white,
  border: borders.quiet,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const check = style({
  width: 24,
  height: 24,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.green,
  border: borders.thin,
  color: colors.black,
});

/** The path: a rail on the left, one node per step. */
export const path = style({
  listStyle: 'none',
  margin: 0,
  padding: '0 0 0 56px',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 19,
      top: 24,
      bottom: 24,
      width: 3,
      background: colors.gray200,
      borderRadius: shapeRadii.pill,
    },
  },
});

export const step = styleVariants({
  actual: { border: borders.thin, boxShadow: shadows.small },
  pendiente: { border: borders.quiet },
  listo: { border: borders.quiet, opacity: 0.75 },
});

export const stepBox = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  padding: '14px 18px',
  borderRadius: radii[6],
  background: colors.white,
});

export const node = style({
  position: 'absolute',
  left: -56,
  top: '50%',
  marginTop: -20,
  width: 40,
  height: 40,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: portalFontSizes.lgx,
});

export const nodeTone = styleVariants({
  actual: { background: colors.yellow },
  pendiente: { background: colors.white },
  listo: { background: colors.green },
});

export const stepText = style({
  flex: '1 1 240px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const stepTitle = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const stepHint = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

const countBase = {
  padding: '2px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
} as const;

export const countDone = style({
  ...countBase,
  background: colors.greenSoft,
  color: colors.greenText,
  border: `2px solid ${colors.greenText}`,
});

export const countOpen = style({
  ...countBase,
  background: colors.yellow,
  color: colors.black,
  border: borders.thin,
});
