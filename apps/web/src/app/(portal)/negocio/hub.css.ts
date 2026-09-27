import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** «Mi negocio»: the title, and one row of tabs for every setting (CfgNegocio). */
export const head = style({ display: 'flex', flexDirection: 'column', gap: 14 });

export const titulos = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const acciones = style({ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' });

export const tabs = style({
  alignSelf: 'flex-start',
  maxWidth: '100%',
  display: 'flex',
  gap: 2,
  padding: 4,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.white,
});

export const tab = style({
  flex: 'none',
  boxSizing: 'border-box',
  minHeight: 40,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  border: '2px solid transparent',
  borderRadius: radii[1],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { color: colors.black, background: colors.gray100 },
    '&[aria-current="page"]': {
      border: borders.thin,
      background: colors.yellow,
      fontWeight: typography.weights.extraBold,
      color: colors.black,
    },
  },
});
