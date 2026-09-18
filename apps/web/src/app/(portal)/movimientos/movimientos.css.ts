import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

export const stackedDate = style({
  display: 'flex',
  flexDirection: 'column',
  fontVariantNumeric: 'tabular-nums',
});

/** The time under the date. A separate class rather than a child selector:
 *  vanilla-extract enforces one class per style block, which is what keeps the
 *  value auditor able to attribute every declaration. */
export const stackedTime = style({
  color: colors.textMuted,
  fontSize: portalFontSizes.sm,
});

export const conceptCell = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
});

export const amountCell = style({
  fontWeight: typography.weights.extraBold,
  selectors: {
    '&[data-kind="venta"]': { color: colors.greenText },
    '&[data-kind="gasto"]': { color: colors.redText },
  },
});

export const cancelledAmount = style([
  amountCell,
  { textDecoration: 'line-through', color: colors.textMuted },
]);

export const toolbar = style({ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' });

export const search = style({
  height: 46,
  minWidth: 280,
  flex: '1 1 280px',
  padding: '0 14px',
  background: colors.offwhite,
  border: `2px solid ${colors.black}`,
  borderRadius: 12,
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5, outline: 'none', background: colors.white } },
});

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const pageSubtitle = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
