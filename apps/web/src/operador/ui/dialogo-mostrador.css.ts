import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, radii, shadows } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

const pop = keyframes({
  from: { opacity: 0, transform: 'scale(0.94)' },
  to: { opacity: 1, transform: 'none' },
});

/** El Mostrador's centred dialog: the scrim, then a white card with a hard shadow. */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  overflowY: 'auto',
  background: colors.scrim,
});

export const card = style({
  position: 'relative',
  boxSizing: 'border-box',
  width: '100%',
  maxHeight: 'calc(100dvh - 32px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: shadows.hero,
  animation: `${pop} 220ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
  selectors: {
    /* Don Cuentas peeks over the top edge, so this card cannot clip. */
    '&[data-don]': { overflow: 'visible', maxHeight: 'none', marginTop: 56 },
  },
});

/** The 44 px close square in a dialog's or a drawer's head. */
export const cerrar = style([
  pressable,
  {
    boxSizing: 'border-box',
    flex: 'none',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.black,
    selectors: { '&[data-fuerte]': { border: borders.thin } },
  },
]);
