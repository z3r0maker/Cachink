import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shadows, shapeRadii, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/**
 * Option cards.
 *
 * CLAUDE.md §6: when a form presents ≤ 5 mutually-exclusive choices, use
 * tappable icon + bold label + one-line description cards stacked vertically,
 * never a dropdown. `<Combobox>` is reserved for 6+ options or lists that grow.
 */
export const group = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const option = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    padding: '16px 18px',
    textAlign: 'left',
    font: 'inherit',
    color: colors.black,
    background: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.small,
    selectors: {
      '&[data-selected="true"]': { background: colors.yellowSoft, boxShadow: shadows.card },
    },
  },
]);

export const optionDot = style({
  width: 20,
  height: 20,
  flex: 'none',
  marginTop: 2,
  background: colors.white,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  selectors: { '[data-selected="true"] &': { background: colors.yellow } },
});

export const optionTitle = style({
  display: 'block',
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const optionBody = style({
  display: 'block',
  marginTop: 4,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

/** Usage bar. Only a capped allowance gets one — see `UsageBar`. */
export const barTrack = style({
  height: 12,
  background: colors.gray100,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[0],
  overflow: 'hidden',
});

export const barFill = style({ display: 'block', height: '100%' });
