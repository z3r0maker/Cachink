/**
 * The art of each page: the colour, the shapes and the logo that sit behind the
 * text. Positions are inches from the page's corner, and `designs.ts` places
 * the text over them with the same numbers.
 */

import { colors } from '../../packages/tokens/src/index.js';

import { accent, at, card, coin, hrule, IN, lockup, page, rect, wordmark } from './art-parts.js';
import { coinDetailed, FOLDER, LETTER, markFlat, sized, type PageSize } from './sources.js';

export interface ArtPage {
  readonly size: PageSize;
  readonly html: () => string;
}

/** A master's 1024 box, in inches, when its disc of `disc` units is `inches` across. */
const box = (inches: number, disc: number): number => (inches * 1024) / disc;

/** Amarillo: the splash's composition, centred, with a white card for the title. */
export const AMARILLO: ArtPage = {
  size: LETTER,
  html: () => {
    // The detailed coin's rim is 784 of the box; 2.4 in across on the page.
    const side = box(2.4, 784);
    const rule = `width:3px;height:${0.62 * IN}px;margin-left:-1.5px;background:${colors.yellowRule}`;
    return page(
      LETTER,
      colors.yellow,
      `${at(4.25 - side / 2, 2.05 - side / 2, sized(coinDetailed(), side * IN))}
      ${wordmark(3.52, 3.3)}
      ${card(1, 5.5, 6.5, 2.8)}
      ${hrule(1, 8.98, 6.5, 3, colors.yellowRule)}
      ${at(4.25, 9.2, '', rule)}`,
    );
  },
};

/** Negro: black ground, the coin oversized and cropped at the right, a yellow band. */
export const NEGRO: ArtPage = {
  size: LETTER,
  html: () => {
    // The flat mark's disc is 790 of the box; 5.6 in across on the page.
    const side = box(5.6, 790);
    return page(
      LETTER,
      colors.black,
      `${at(6.7 - side / 2, 3.55 - side / 2, sized(markFlat(), side * IN))}
      ${lockup({ x: 0.9, y: 0.9, d: 0.58 * IN, light: true })}
      ${rect(0, 9, 8.5, 2, `background:${colors.yellow}`)}`,
    );
  },
};

/** Moneda: the splash's composition on white paper, inside ordinary print margins. */
export const MONEDA: ArtPage = {
  size: LETTER,
  html: () =>
    page(
      LETTER,
      colors.white,
      `${at(0, 1.15, coin(2.3 * IN), 'width:100%;display:flex;justify-content:center')}
      ${wordmark(3.95, 3.3)}
      ${hrule(1.25, 5.75, 6)}
      ${hrule(1.25, 8.4, 6)}`,
    ),
};

/** The folder's front: black on the folder's own paper, small yellow accents, wide margins. */
export const FOLDER_FRONT: ArtPage = {
  size: FOLDER,
  html: () => {
    const left = (FOLDER.w - 6.65) / 2;
    return page(
      FOLDER,
      colors.white,
      `${lockup({ y: 2.55, d: 1.15 * IN })}
      ${accent(FOLDER.w / 2 - 0.575, 4.85)}
      ${card(left, 7, 6.65, 2.5)}
      ${hrule(left + 0.45, 8.05, 5.75, 3)}
      ${hrule(left + 0.45, 9.05, 5.75, 3)}`,
    );
  },
};
