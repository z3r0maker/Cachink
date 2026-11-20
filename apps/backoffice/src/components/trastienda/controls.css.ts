import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  pressTransform,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

/** The passkey button and its notices inside the vale (ADR-160). */

/* ─── Controls inside the ticket ─── */

/** A line under the button: what the browser's own prompt will ask for. */
export const hint = style({
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  lineHeight: 1.5,
  color: colors.ink,
});

const noticeBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[3],
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  lineHeight: 1.45,
  color: colors.ink,
  border: borders.thin,
});

export const notice = styleVariants({
  aviso: [noticeBase, { background: colors.warningSoft, borderColor: colors.warningText }],
  error: [noticeBase, { background: colors.redSoft, borderColor: colors.redText }],
  ok: [noticeBase, { background: colors.greenSoft, borderColor: colors.greenText }],
});

export const noticeTitle = style({
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
});

/** A secondary way out of the vale («Ir a la entrada»). */
export const secondary = style({
  height: 52,
  border: borders.thick,
  borderRadius: radii[3],
  background: colors.white,
  boxShadow: shadows.small,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
});

export const cta = style({
  height: 56,
  marginTop: 4,
  border: borders.thick,
  borderRadius: radii[3],
  background: colors.yellow,
  boxShadow: shadows.card,
  fontFamily: 'inherit',
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  textDecoration: 'none',
  cursor: 'pointer',
  selectors: {
    '&:active:not(:disabled)': { transform: pressTransform.to, boxShadow: shadows.pressed },
    '&:disabled': { opacity: 0.6, cursor: 'progress' },
  },
});
