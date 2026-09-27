import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/**
 * Cobrar inside the ticket (ADR-107): the method is picked where the total
 * is, and cash or fiado take their step in the same column.
 */
export const metodos = style({
  display: 'grid',
  // «Transferencia» is the long word: its column gets the extra room.
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)',
  gap: 6,
});

export const metodo = style([
  pressable,
  {
    height: 44,
    padding: '0 4px',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    selectors: {
      '&[aria-checked="true"]': {
        background: colors.black,
        borderColor: colors.black,
        color: colors.yellow,
      },
    },
  },
]);

export const pasoHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 16px',
  borderBottom: borders.quiet,
});

export const pasoBack = style([
  pressable,
  {
    flex: 'none',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.black,
    cursor: 'pointer',
  },
]);

export const pasoTitles = style({ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 });

export const pasoEyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const pasoTitle = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.02em',
  color: colors.black,
});

export const pasoTotal = style({
  flex: 'none',
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const pasoBody = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
});

/** The step replaces the ticket inside the same panel. */
export const paso = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});
