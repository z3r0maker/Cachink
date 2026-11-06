import { style } from '@vanilla-extract/css';

/** The photo at its given side; the WebP is transparent, so the tile's tint shows through. */
export const photo = style({
  display: 'block',
  objectFit: 'contain',
});
