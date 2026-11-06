import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * «Empresa»'s page tabs (plan §2, boards «Dinero» and «Cumplimiento» of
 * canvas «Ronda 7 · Navegación»): the segmented bar under an entry's title.
 * A screen's own views and filters keep their smaller bar inside the content.
 */
export const pageTabs = style({
  display: 'flex',
  width: 'fit-content',
  maxWidth: '100%',
  boxSizing: 'border-box',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 14,
  padding: 4,
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
});

export const pageTab = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 20px',
  borderRadius: radii[1],
  color: colors.ink,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  textDecoration: 'none',
  selectors: {
    '&:hover': { background: colors.gray100 },
    '&[aria-current="page"]': {
      background: colors.yellow,
      color: colors.black,
      fontWeight: typography.weights.extraBold,
    },
  },
});
