import { keyframes, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

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

/** A statement line. Hierarchy is carried by weight and a rule, not by colour. */
export const line = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  padding: '12px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const lineTotal = style({
  borderBottom: `2.5px solid ${colors.black}`,
  fontWeight: typography.weights.extraBold,
});

export const lineLabel = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const lineSubtitle = style({
  marginTop: 2,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const lineAmount = style({
  marginLeft: 'auto',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const isrNotice = style({
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  background: colors.yellowSoft,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  padding: 16,
});

export const summaryFigure = style({
  margin: '10px 0 0',
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
});

/** The 23×23 disclosure toggle on an expandable line (design handoff). */
export const disclosure = style({
  width: 23,
  height: 23,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[0],
  background: colors.white,
  fontWeight: typography.weights.extraBold,
  lineHeight: 1,
  cursor: 'pointer',
});

/** A breakdown row under an expanded line: indented and lighter. */
export const subLine = style({
  display: 'flex',
  gap: 12,
  padding: '8px 0 8px 35px',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  borderBottom: `2px solid ${colors.gray200}`,
});

export const chartTitle = style({
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tight,
  margin: 0,
});

/** The 14px muted line under a chart's title — «De lo que vendiste a lo que te quedó». */
export const chartSubtitle = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  margin: '4px 0 0',
});

/**
 * The design's own chart motion: bars unroll from the level they start at over
 * 520ms, the donut sweeps over 420ms. Both are held under reduced motion,
 * where the mark simply appears at full size.
 */
const crecer = keyframes({
  from: { transform: 'scaleY(0)' },
  to: { transform: 'scaleY(1)' },
});

const barrer = keyframes({
  from: { transform: 'rotate(-40deg)', opacity: 0 },
  to: { transform: 'rotate(0)', opacity: 1 },
});

export const crece = style({
  transformBox: 'fill-box',
  animation: `${crecer} 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const barrido = style({
  animation: `${barrer} 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const donutTitulo = style({
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tight,
  margin: '0 0 14px',
  textWrap: 'pretty',
});

export const donutLista = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
});

export const donutFila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const donutSwatch = style({
  width: 14,
  height: 14,
  flex: 'none',
  border: `2px solid ${colors.black}`,
  borderRadius: 4,
});

export const donutMonto = style({
  marginLeft: 'auto',
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  whiteSpace: 'nowrap',
});

export const chartNote = style({
  fontSize: portalFontSizes.xs,
  color: colors.gray600,
  margin: '8px 0 0',
});

export const donutGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 20,
  alignItems: 'start',
});
