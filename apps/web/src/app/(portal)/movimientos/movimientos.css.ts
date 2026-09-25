import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

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

/**
 * The circular badge the design puts before a concepto — `$` on green for a
 * venta, `−` on red for a gasto (B-3). It reads before the colour does, which
 * is the point: the tint alone would carry the kind.
 */
export const conceptBadge = style({
  width: 36,
  height: 36,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 9999,
  border: `2px solid ${colors.black}`,
  fontWeight: typography.weights.extraBold,
  fontSize: portalFontSizes.body,
});

/** The drawer's amount (ADR-107): big and signed, on the record's soft tint. */
export const detalleMonto = style({
  padding: '16px 18px',
  borderRadius: radii[3],
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
});

/** Small caps over each block of the drawer. */
export const detalleLinea = style({
  margin: '18px 0 8px',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

/** Who, where, how: two tiles a row instead of a ruled list. */
export const fichas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginTop: 14,
});

export const ficha = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
});

export const fichaLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
});

export const fichaValor = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  overflowWrap: 'anywhere',
});

/** One line of the ticket: what, and how much. */
export const renglon = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  selectors: { '& + &': { marginTop: 6 } },
});
