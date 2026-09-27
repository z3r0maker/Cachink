import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Step 2's review: the summary, the filter, the rows and the action bar. */
const PHONE = 'screen and (max-width: 767px)';

export const resumenFila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: '12px 16px',
});

export const resumen = style({
  flex: '1 1 280px',
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const cuenta = styleVariants({
  nuevo: { color: colors.greenText },
  actualizar: { color: colors.blueText },
  'sin-cambios': { color: colors.gray600 },
  error: { color: colors.warningText },
});

export const filtros = style({ display: 'flex', gap: 6, flexWrap: 'wrap' });

export const filtro = style({
  height: 44,
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  cursor: 'pointer',
  selectors: {
    '&[aria-pressed="true"]': {
      background: colors.black,
      border: borders.thin,
      color: colors.yellow,
    },
  },
});

export const scroll = style({
  maxHeight: 440,
  overflowY: 'auto',
  borderTop: borders.quiet,
});

export const tabla = style({ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' });

export const th = style({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: '8px 16px',
  background: colors.offwhite,
  borderBottom: borders.quiet,
  textAlign: 'left',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const thFila = style([th, { width: 72, '@media': { [PHONE]: { display: 'none' } } }]);
export const thEstado = style([th, { width: '38%', '@media': { [PHONE]: { width: '52%' } } }]);

export const td = style({
  padding: '8px 16px',
  borderBottom: `2px solid ${colors.gray100}`,
  verticalAlign: 'middle',
  '@media': { [PHONE]: { padding: '8px 10px' } },
});

export const linea = style({
  '@media': { [PHONE]: { display: 'none' } },
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const quien = style({ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 });

export const glifo = style({
  flex: 'none',
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[0],
  background: colors.yellowSoft,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  '@media': { [PHONE]: { display: 'none' } },
});

export const nombre = style({
  display: 'block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const chip = style({
  display: 'inline-flex',
  maxWidth: '100%',
  overflowWrap: 'anywhere',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  border: '2px solid currentColor',
  borderRadius: radii[5],
  fontSize: portalFontSizes.xs,
  lineHeight: 1.3,
  fontWeight: typography.weights.extraBold,
});

export const chipTono = styleVariants({
  nuevo: { background: colors.greenSoft, color: colors.greenText },
  actualizar: { background: colors.blueSoft, color: colors.blueText },
  'sin-cambios': { background: colors.gray100, color: colors.gray600 },
  error: { background: colors.warningSoft, color: colors.warningText },
});

export const chipPunto = style({
  flex: 'none',
  width: 7,
  height: 7,
  borderRadius: shapeRadii.pill,
  background: 'currentColor',
});

export const nadaQueVer = style({ padding: '16px' });

export const barra = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: '12px 16px',
  borderTop: borders.quiet,
});

export const empuja = style({ flex: 1 });

export const liga = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 44,
  padding: '0 6px',
  border: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  cursor: 'pointer',
});
