import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shadows, typography } from '@xangarro/tokens';

/**
 * Table.
 *
 * Header row 52 px on `gray100` with a 2.5 px bottom rule; body rows at least
 * 56 px (comfortable density) divided by 2 px `gray200`; hover tints
 * `yellowSoft` over 90 ms. The whole table scrolls **inside its card** rather
 * than breaking the page, so the wrapper owns `overflow-x` and the table keeps
 * a `min-width`.
 */
export const tableCard = style({
  background: colors.white,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[4],
  boxShadow: shadows.card,
  overflow: 'hidden',
});

export const scroller = style({ overflowX: 'auto' });

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: typography.fontFamily,
});

export const th = style({
  height: 52,
  padding: '0 16px',
  background: colors.gray100,
  borderBottom: `2.5px solid ${colors.black}`,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
  textAlign: 'left',
  whiteSpace: 'nowrap',
});

export const thNumeric = style({ textAlign: 'right' });

export const tr = style({
  minHeight: 56,
  transitionProperty: 'background',
  transitionDuration: '90ms',
  selectors: {
    '&:hover': { background: colors.yellowSoft },
    '&[data-selected="true"]': { background: colors.yellowSoft },
    '&[data-cancelled="true"]': { color: colors.textMuted },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' } },
});

export const td = style({
  height: 56,
  padding: '0 16px',
  borderBottom: `2px solid ${colors.gray200}`,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

/** Money right-aligns with tabular numerals so columns line up. */
export const tdNumeric = style({
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: typography.weights.bold,
});

export const tdStruck = style({ textDecoration: 'line-through' });

export const tableFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 16px',
  borderTop: `2px solid ${colors.gray200}`,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});
