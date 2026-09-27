import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * The quiet controls of CfgCortes and CfgAvisos: a white tab row with the
 * active tab in yellow, the toggles beside it (black when on) and the search.
 */
export const barra = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
});

export const pestanas = style({
  display: 'flex',
  gap: 2,
  padding: 4,
  maxWidth: '100%',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.white,
});

export const pestana = style({
  flex: 'none',
  minHeight: 40,
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '2px solid transparent',
  borderRadius: radii[1],
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:hover': { color: colors.black, background: colors.gray100 },
    '&[aria-pressed="true"]': {
      border: borders.thin,
      background: colors.yellow,
      fontWeight: typography.weights.extraBold,
      color: colors.black,
    },
  },
});

export const cuenta = style({ fontVariantNumeric: 'tabular-nums' });

export const separador = style({
  width: 2,
  height: 28,
  margin: '0 4px',
  background: colors.gray200,
  '@media': { '(max-width: 720px)': { display: 'none' } },
});

export const palanca = style({
  minHeight: 44,
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: colors.black },
    '&[aria-pressed="true"]': {
      border: borders.thin,
      background: colors.black,
      color: colors.yellow,
      fontWeight: typography.weights.extraBold,
    },
  },
});

export const buscar = style({
  marginLeft: 'auto',
  width: 320,
  maxWidth: '100%',
  minHeight: 44,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  color: colors.gray600,
  selectors: { '&:focus-within': { border: borders.thin } },
  '@media': { '(max-width: 720px)': { width: '100%', marginLeft: 0 } },
});

export const buscarInput = style({
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});
