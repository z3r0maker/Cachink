import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Agenda (E-04, boards CD-05 and CD-05b): tabs, the dated rows, chips and the matrix. */

export const tabs = style({
  display: 'inline-flex',
  gap: 4,
  padding: 4,
  borderRadius: radii[2],
  border: borders.thin,
  background: colors.white,
});

export const tab = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '0 16px',
  borderRadius: radii[0],
  color: colors.black,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  selectors: { '&[aria-current="page"]': { background: colors.yellow } },
});

export const layout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
  gap: 18,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const groupLabel = style({
  margin: '0 0 6px',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const groupTone = styleVariants({
  bad: { color: colors.redText },
  dim: { color: colors.gray600 },
});

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const item = style({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '92px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 14,
  padding: '12px 14px',
  borderRadius: radii[3],
  selectors: {
    '&:hover': { background: colors.offwhite },
    '&:focus-within': { outline: `3px solid ${colors.black}`, outlineOffset: -3 },
  },
});

export const itemLate = style({
  background: colors.redSoft,
  selectors: { '&:hover': { background: colors.redSoft } },
});

export const when = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const whenDate = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const whenLeft = styleVariants({
  late: {
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.redText,
  },
  soon: {
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
});

export const itemLink = style({
  color: colors.black,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  outline: 'none',
  selectors: { '&::after': { content: '""', position: 'absolute', inset: 0 } },
});

export const itemBasis = style({
  display: 'block',
  marginTop: 2,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

const chipBase = style({
  display: 'inline-block',
  alignSelf: 'flex-start',
  padding: '4px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const chip = styleVariants({
  ok: [chipBase, { background: colors.greenSoft, color: colors.greenText }],
  warn: [chipBase, { background: colors.warningSoft, color: colors.warningText }],
  bad: [chipBase, { background: colors.redSoft, color: colors.redText }],
  info: [chipBase, { background: colors.blueSoft, color: colors.blueText }],
  off: [chipBase, { background: colors.gray100, color: colors.gray600 }],
});

export const meta = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const authority = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const matrix = style({ width: '100%', borderCollapse: 'collapse' });

export const cell = style({
  padding: '10px 12px',
  textAlign: 'left',
  borderTop: `2px solid ${colors.gray100}`,
  verticalAlign: 'top',
});

export const pills = style({ display: 'flex', flexWrap: 'wrap', gap: 6 });

export const cellLink = style({ textDecoration: 'none' });
