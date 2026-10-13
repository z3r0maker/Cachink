import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The Expediente (E-05, board CD-06): folders, the table and the history panel. */

export const layout = style({
  display: 'grid',
  gridTemplateColumns: '220px minmax(0, 1fr) minmax(280px, 340px)',
  gap: 18,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 1200px)': { gridTemplateColumns: '200px minmax(0, 1fr)' },
    'screen and (max-width: 800px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
});

export const folders = style({
  listStyle: 'none',
  margin: 0,
  padding: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

/** A folder is a filter: selected is black with yellow text. */
export const folder = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  minHeight: 40,
  padding: '0 12px',
  borderRadius: radii[2],
  color: colors.black,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  textDecoration: 'none',
  selectors: {
    '&:hover': { background: colors.offwhite },
    '&[aria-current="page"]': { background: colors.black, color: colors.yellow },
  },
});

export const count = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const note = style({
  margin: 0,
  padding: '8px 12px 12px',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const version = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 0',
  borderTop: `2px solid ${colors.gray100}`,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const versionCurrent = style({
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});
