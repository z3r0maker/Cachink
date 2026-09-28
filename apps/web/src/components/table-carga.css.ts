import { keyframes, style } from '@vanilla-extract/css';
import { colors, shapeRadii } from '@xangarro/tokens';

/**
 * A table waiting on the server (DS-01): a thin bar under the header row and
 * the old rows dimmed until the new page arrives. The track is always there,
 * so the rows do not jump when the bar comes and goes.
 */
const barrido = keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(260%)' },
});

export const pista = style({
  position: 'relative',
  height: 3,
  padding: 0,
  overflow: 'hidden',
  selectors: { '&[data-busy="true"]': { background: colors.yellow } },
});

export const barra = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  width: '40%',
  borderRadius: shapeRadii.mark,
  background: colors.black,
  animation: `${barrido} 1.1s ease-in-out infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const atenuado = style({
  transition: 'opacity 150ms',
  selectors: { '&[data-busy="true"]': { opacity: 0.45 } },
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});

/** A full-width row under the header: the message the old rows stay under. */
export const avisoCelda = style({ padding: '8px 12px' });
