import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Cuentas de socios» (E-03, board CD-04): avatars, figures, the halves and the split bar. */

export const grid2 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 18,
  alignItems: 'start',
});

export const heroRow = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 });

export const heroText = style({
  flex: '1 1 280px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const heroTitle = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

const avatarBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  width: 40,
  height: 40,
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const avatar = styleVariants({
  1: [avatarBase, { background: colors.yellow }],
  2: [avatarBase, { background: colors.blueSoft }],
});

export const who = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const whoName = style({
  display: 'block',
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const figures = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginTop: 14,
});

export const figure = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const figureLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const figureValue = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const figureNote = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

const halfBase = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: radii[3],
});

export const half = styleVariants({
  ok: [halfBase, { background: colors.greenSoft }],
  warn: [halfBase, { background: colors.warningSoft }],
  bad: [halfBase, { background: colors.redSoft }],
});

export const halfLabel = styleVariants({
  ok: { fontWeight: typography.weights.extraBold, color: colors.greenText },
  warn: { fontWeight: typography.weights.extraBold, color: colors.warningText },
  bad: { fontWeight: typography.weights.extraBold, color: colors.redText },
});

export const halfText = style({
  display: 'flex',
  flexDirection: 'column',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const preview = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '14px 16px',
  borderRadius: radii[3],
  background: colors.yellowSoft,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const previewStrong = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const splitBar = style({
  display: 'flex',
  height: 22,
  borderRadius: radii[0],
  overflow: 'hidden',
  border: borders.thin,
  background: colors.blueSoft,
});

export const splitBolsa = style({ background: colors.yellow, borderRight: borders.thin });

export const history = style({
  display: 'grid',
  gridTemplateColumns: '64px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderTop: `2px solid ${colors.gray100}`,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const historyDate = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const historyAmount = style({
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});
