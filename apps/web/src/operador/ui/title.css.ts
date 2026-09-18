import { style } from '@vanilla-extract/css';
import { colors, fontSizes, portalFontSizes, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** «Tu turno · Ana Robledo · Caja 1 …»: the h1 row of the list screens. */
export const titleRow = style({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

export const pageTitle = style({
  margin: 0,
  fontSize: fontSizes.xl4,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl3 } },
});

export const pageSub = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
