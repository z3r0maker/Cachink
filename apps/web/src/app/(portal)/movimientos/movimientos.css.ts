import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

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

/** The drawer's amount block: a 44px figure over its date stamp (B-2). */
export const detalleHero = style({
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.card,
  padding: 20,
  fontWeight: typography.weights.bold,
});

export const detalleCifra = style({
  fontSize: portalFontSizes.displayLg,
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
  marginBottom: 8,
});

/** One `label · value` row of the field list, ruled off from the next. */
export const fichaFila = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  padding: '10px 0',
  borderBottom: `2px solid ${colors.gray200}`,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
});

export const detalleLinea = style({
  display: 'inline-block',
  fontSize: portalFontSizes.md,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const detalleSello = style({
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  padding: 14,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
});
