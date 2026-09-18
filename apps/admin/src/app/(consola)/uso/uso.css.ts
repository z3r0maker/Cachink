import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, typography } from '@xangarro/tokens';

const badgeBase = style({
  display: 'inline-block',
  marginLeft: 6,
  padding: '1px 6px',
  borderRadius: radii[2],
  border: borders.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

/** One badge per ADR-065 threshold; colour is backed by the text, never alone. */
export const badge = styleVariants({
  80: [badgeBase, { background: colors.warningSoft }],
  100: [badgeBase, { background: colors.redSoft }],
  150: [badgeBase, { background: colors.redText, color: colors.white }],
  upgrade: [badgeBase, { background: colors.blueSoft }],
});
