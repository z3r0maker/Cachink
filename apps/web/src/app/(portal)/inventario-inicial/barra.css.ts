import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/** «Inventario inicial»: the toolbar over the grid and the grid's footer. */
const PHONE = 'screen and (max-width: 767px)';

export const barra = style({ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' });

export const csv = style({
  marginLeft: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 6,
  '@media': { [PHONE]: { marginLeft: 0, alignItems: 'flex-start' } },
});

export const pie = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 20px',
  background: colors.offwhite,
});

export const pieTexto = style({
  flex: 1,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const pieTotal = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});
