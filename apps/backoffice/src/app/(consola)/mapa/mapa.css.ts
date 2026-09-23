import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, typography } from '@xangarro/tokens';

const swatchBase = style({
  display: 'inline-block',
  width: 14,
  height: 14,
  marginRight: 6,
  border: borders.thin,
  borderRadius: radii[1],
  verticalAlign: 'middle',
});

/**
 * The shading classes, keyed by `Bucket` (server/geo/metrics.ts). Two families
 * because the two metric kinds answer different questions: a count is shaded
 * sequentially against the period maximum, a rate diverges around the national
 * average, and `insuficiente` must never read as a zero.
 *
 * N-59 reuses these exact keys for the SVG paths — a class, not a `style`
 * attribute, because the CSP has no 'unsafe-inline' (ui.css.ts:86).
 */
export const swatch = styleVariants({
  cero: [swatchBase, { background: colors.white }],
  b1: [swatchBase, { background: colors.yellowSoft }],
  b2: [swatchBase, { background: colors.yellow }],
  b3: [swatchBase, { background: colors.warningSoft }],
  b4: [swatchBase, { background: colors.redSoft }],
  insuficiente: [swatchBase, { background: colors.gray200 }],
  abajo: [swatchBase, { background: colors.redSoft }],
  igual: [swatchBase, { background: colors.white }],
  arriba: [swatchBase, { background: colors.greenSoft }],
});

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 14,
  margin: '10px 0 0',
  padding: 0,
  listStyle: 'none',
  fontSize: fontSizes.sm,
});

export const value = style({
  fontVariantNumeric: 'tabular-nums',
  fontWeight: typography.weights.bold,
});

export const faint = style({ color: colors.textMuted });
