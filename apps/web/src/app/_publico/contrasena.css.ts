import { globalStyle, style } from '@vanilla-extract/css';
import { colors, radii } from '@xangarro/tokens';

export const caja = style({ position: 'relative' });

globalStyle(`${caja} > input`, { paddingRight: 56 });

export const ojo = style({
  position: 'absolute',
  top: '50%',
  right: 4,
  transform: 'translateY(-50%)',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: 0,
  borderRadius: radii[1],
  background: 'none',
  color: colors.black,
  cursor: 'pointer',
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.black}`, outlineOffset: 0 } },
});

export const pistaCampo = style({ marginTop: 6 });
