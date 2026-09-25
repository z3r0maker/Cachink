import { style, styleVariants } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

const swatchBase = style({
  display: 'inline-block',
  width: 14,
  height: 14,
  marginRight: 6,
  border: line.thin,
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
  cero: [swatchBase, { background: t.raised }],
  b1: [swatchBase, { background: t.heat1 }],
  b2: [swatchBase, { background: t.heat2 }],
  b3: [swatchBase, { background: t.heat3 }],
  b4: [swatchBase, { background: t.heat4 }],
  insuficiente: [swatchBase, { background: t.raised }],
  abajo: [swatchBase, { background: t.badSoft }],
  igual: [swatchBase, { background: t.surface }],
  arriba: [swatchBase, { background: t.okSoft }],
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

export const faint = style({ color: t.dim });

const pathBase = style({
  stroke: t.bg,
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
  cero: [pathBase, { fill: t.raised }],
  b1: [pathBase, { fill: t.heat1 }],
  b2: [pathBase, { fill: t.heat2 }],
  b3: [pathBase, { fill: t.heat3 }],
  b4: [pathBase, { fill: t.heat4 }],
  insuficiente: [pathBase, { fill: t.raised }],
  abajo: [pathBase, { fill: t.badSoft }],
  igual: [pathBase, { fill: t.surface }],
  arriba: [pathBase, { fill: t.okSoft }],
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
  background: t.accentSoft,
  fontWeight: typography.weights.bold,
});
