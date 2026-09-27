import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Cómo quieres enterarte»: a quiet panel, one row per aviso, one column per channel. */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 24px 8px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': { '(max-width: 720px)': { padding: '16px 16px 6px' } },
});

export const cabeza = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 16,
  marginBottom: 12,
  flexWrap: 'wrap',
});

export const ceja = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const explica = style({
  margin: '4px 0 0',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const fila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 150px 150px',
  gap: 12,
  alignItems: 'center',
  minHeight: 62,
  padding: '8px 0',
  borderBottom: `2px solid ${colors.gray100}`,
  '@media': { '(max-width: 720px)': { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' } },
});

export const encabezado = style([
  fila,
  {
    minHeight: 0,
    padding: '10px 0',
    borderBottom: borders.thin,
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.extraBold,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: colors.gray600,
    '@media': { '(max-width: 720px)': { display: 'none' } },
  },
]);

export const centro = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  textAlign: 'center',
  '@media': {
    '(max-width: 720px)': {
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'flex-start',
      textAlign: 'left',
    },
  },
});

/** On a phone the column heads hide, so each cell names its channel. */
export const canalMovil = style({
  display: 'none',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  '@media': { '(max-width: 720px)': { display: 'inline' } },
});

export const nombre = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const grupo = style({
  padding: '2px 8px',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const desc = style({
  display: 'block',
  marginTop: 2,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const siempre = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.ink,
});

export const pie = style({
  margin: '12px 0 10px',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** The aviso's name and description: a row of its own on a phone. */
export const info = style({ '@media': { '(max-width: 720px)': { gridColumn: '1 / -1' } } });
