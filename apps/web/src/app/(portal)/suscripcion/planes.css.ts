import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** CfgPlan's «Planes» and «Don Cuentas en cada plan»: three white cards, yours marked. */
export const seg = style({
  display: 'flex',
  gap: 2,
  padding: 4,
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.white,
});

export const segBoton = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 40,
  padding: '0 12px',
  border: '2px solid transparent',
  borderRadius: radii[1],
  background: 'transparent',
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: colors.gray100 },
    '&[aria-checked="true"]': {
      border: borders.thin,
      background: colors.yellow,
      color: colors.black,
    },
  },
});

export const gratisTag = style({
  padding: '2px 8px',
  border: `2px solid ${colors.greenText}`,
  borderRadius: shapeRadii.pill,
  background: colors.greenSoft,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.greenText,
  whiteSpace: 'nowrap',
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
  gap: 16,
  alignItems: 'start',
});

const carta = {
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0,
  padding: '20px 22px',
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
  background: colors.white,
} as const;

export const plan = style(carta);

/** Yours: a yellow band across the top and a black «Tu plan» tag riding the edge. */
export const planTuyo = style({ ...carta, paddingTop: 34 });

export const banda = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 14,
  background: colors.yellow,
  borderBottom: borders.thick,
  borderRadius: `${radii[7] - 2.5}px ${radii[7] - 2.5}px 0 0`,
});

export const tuPlanTag = style({
  position: 'absolute',
  top: -14,
  right: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 12px',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.black,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.yellow,
});

export const nombre = style({
  margin: 0,
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const pitch = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const precioFila = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  flexWrap: 'wrap',
});

export const precio = style({
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const periodo = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

/** «Este es tu plan»: a soft yellow statement, not a button to press. */
export const esteEs = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 44,
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.yellowSoft,
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  cursor: 'default',
  selectors: { '&:disabled': { opacity: 1 } },
});

export const ctas = style({ display: 'grid', gap: 10 });

export const lista = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
});

export const rasgo = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: portalFontSizes.md,
  lineHeight: 1.35,
  fontWeight: typography.weights.semibold,
  color: colors.black,
});

export const rasgoNo = style([rasgo, { color: colors.gray600 }]);

export const marca = style({ flex: 'none', marginTop: 1 });
