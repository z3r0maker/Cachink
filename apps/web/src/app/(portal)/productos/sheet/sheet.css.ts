import { style } from '@vanilla-extract/css';
import { colors, radii, shadows, shapeRadii } from '@xangarro/tokens';

/** The «Nuevo producto» sheet (P-07): stacked sections, chips, swatches, icon grid. */
export const section = style({ display: 'grid', gap: 12, paddingBottom: 18 });

export const chipRow = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });

export const twoCol = style({ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' });

export const toggleRow = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const swatch = style({
  width: 44,
  height: 44,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  cursor: 'pointer',
  selectors: {
    '&[aria-checked="true"]': { boxShadow: shadows.small, outline: `3px solid ${colors.yellow}` },
  },
});

export const preview = style({
  display: 'grid',
  placeItems: 'center',
  gap: 6,
  width: 120,
  height: 120,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  boxShadow: shadows.card,
  fontWeight: 800,
  textAlign: 'center',
  padding: 8,
});
