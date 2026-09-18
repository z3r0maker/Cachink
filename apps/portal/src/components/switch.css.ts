import { style } from '@vanilla-extract/css';
import { colors, shadows, shapeRadii } from '@xangarro/tokens';

/**
 * The on/off switch. No design exists for it yet, so it speaks the rest of the
 * system's language: a 2px black border, the small offset shadow, yellow for
 * "on". The hit area is 44px even though the track is 26px tall.
 */
export const root = style({
  position: 'relative',
  width: 48,
  height: 44,
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  selectors: { '&[data-disabled]': { cursor: 'not-allowed', opacity: 0.45 } },
});

export const track = style({
  position: 'absolute',
  inset: '9px 0',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
  boxShadow: shadows.small,
  selectors: { [`${root}[data-state="checked"] &`]: { background: colors.yellow } },
});

export const thumb = style({
  position: 'absolute',
  top: 13,
  left: 4,
  width: 18,
  height: 18,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  transition: 'transform 120ms ease-out',
  selectors: { '&[data-state="checked"]': { transform: 'translateX(22px)' } },
});
