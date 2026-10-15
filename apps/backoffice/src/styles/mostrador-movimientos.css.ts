import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Movimientos' recurring expenses and filters (E-02, boards CD-02 and CD-03):
 * the «Hacer recurrente cada mes» box, the search and the category row.
 */

export const casilla = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  cursor: 'pointer',
});

export const casillaInput = style({
  width: 20,
  height: 20,
  margin: 0,
  flex: '0 0 auto',
  accentColor: colors.black,
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 } },
});

export const casillaText = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const casillaTitle = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

/** The prefilled charge's note above the form: «Registra Vercel de octubre». */
export const aviso = style({
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.purpleSoft,
  color: colors.ink,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
});

export const barra = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
});

export const buscar = style({ display: 'flex', alignItems: 'center', gap: 8, minWidth: 280 });

export const buscarInput = style({
  flex: 1,
  minHeight: 40,
  padding: '0 12px',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  color: colors.black,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.yellow}`, outlineOffset: 1 } },
});

export const rotulo = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

/** «Dejar de repetir» sits in the row; a form per row so it posts without script. */
export const enLinea = style({ display: 'inline', margin: 0 });
