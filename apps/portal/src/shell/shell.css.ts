import { style } from '@vanilla-extract/css';
import { colors } from '@xangarro/tokens';

import { MAX_WIDTH } from './header.css';

export const frame = style({ minHeight: '100vh', display: 'flex', background: colors.gray200 });

export const column = style({ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' });

/** Page ground is deliberately darker than offwhite so cards read as panels. */
export const main = style({ flex: 1, padding: '28px 32px 96px' });

export const content = style({
  maxWidth: MAX_WIDTH,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});
