import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** The quiet figure cards of the reading screens (El Mostrador). */
export const statGrid = style({
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  '@media': { [PHONE]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } },
});

export const stat = style({
  minWidth: 0,
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': { [PHONE]: { padding: '12px 14px' } },
});

/** The figure the operator acts on (efectivo esperado): soft yellow, black edge. */
export const statStrong = style({ border: borders.thin, background: colors.yellowSoft });

export const statValue = style({
  fontSize: portalFontSizes.xl6,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl3 } },
});

export const statHint = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});
