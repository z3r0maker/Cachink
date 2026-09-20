import { style } from '@vanilla-extract/css';

/** The mapping form's stack — plain, like every console form. */
export const formStack = style({
  display: 'grid',
  gap: 12,
  maxWidth: 480,
  margin: '12px 0 24px',
});
