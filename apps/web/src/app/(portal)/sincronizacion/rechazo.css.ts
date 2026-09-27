import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** One refused record: what it was, why it did not enter, and «Ya lo resolví». */
export const top = style({ display: 'flex', gap: 14, alignItems: 'flex-start' });

const tile = {
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  color: colors.black,
} as const;

export const tileTono = styleVariants({
  inventario: { ...tile, background: colors.peachSoft },
  venta: { ...tile, background: colors.yellowSoft },
  otro: { ...tile, background: colors.gray100 },
});

export const cuerpo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: 1,
  minWidth: 0,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  lineHeight: 1.35,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  overflowWrap: 'anywhere',
});

export const motivo = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '8px 12px',
  borderRadius: radii[2],
  background: colors.warningSoft,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const motivoIcono = style({
  display: 'flex',
  flex: 'none',
  marginTop: 2,
  color: colors.warningText,
});

export const tip = style({ fontWeight: typography.weights.semibold, color: colors.gray600 });

/** Everything under the title lines up with the text, past the 44px tile. */
export const sangria = style({
  marginLeft: 58,
  '@media': { '(max-width: 600px)': { marginLeft: 0 } },
});

export const datos = style([
  sangria,
  {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
    gap: 8,
  },
]);

export const dato = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  padding: '8px 10px',
  border: borders.quiet,
  borderRadius: radii[2],
  minWidth: 0,
});

export const datoK = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const datoV = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  overflowWrap: 'anywhere',
});

export const pie = style([
  sangria,
  { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
]);

export const cuando = style({
  flex: '1 1 180px',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const error = style({
  flexBasis: '100%',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});
