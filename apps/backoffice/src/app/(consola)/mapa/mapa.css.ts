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

const pathBase = style({
  stroke: colors.black,
  strokeWidth: 1.2,
  strokeLinejoin: 'round',
  vectorEffect: 'non-scaling-stroke',
});

/**
 * The same bucket keys as `swatch`, applied to SVG paths. `fill` is a CSS
 * property, so it can be a class — which it must be: `style-src` has no
 * 'unsafe-inline', so a `style="fill:…"` attribute would be dropped and every
 * state would render the same colour (ui.css.ts:86).
 */
export const region = styleVariants({
  cero: [pathBase, { fill: colors.white }],
  b1: [pathBase, { fill: colors.yellowSoft }],
  b2: [pathBase, { fill: colors.yellow }],
  b3: [pathBase, { fill: colors.warningSoft }],
  b4: [pathBase, { fill: colors.redSoft }],
  insuficiente: [pathBase, { fill: colors.gray200 }],
  abajo: [pathBase, { fill: colors.redSoft }],
  igual: [pathBase, { fill: colors.white }],
  arriba: [pathBase, { fill: colors.greenSoft }],
});

export const mapFrame = style({
  display: 'block',
  width: '100%',
  maxWidth: 720,
  height: 'auto',
  margin: '12px 0',
});

/** The column the map is currently shaded by; colour is backed by the header text. */
export const selectedCol = style({
  background: colors.yellowSoft,
  fontWeight: typography.weights.bold,
});
