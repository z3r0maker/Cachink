/**
 * Where the text may sit on a page.
 *
 * The text lives in a table that floats over the art, placed from the page's
 * corner. Its rows are bands given in inches from the top edge, so the numbers
 * here are the same ones the art is drawn with.
 */

import type { PageSize } from './sources.js';

/** A band of the page, in inches from its top edge. */
export interface Band {
  readonly from: number;
  readonly to: number;
}

const EPSILON = 1e-6;

/**
 * How far above the bottom margin the last band must end. Measured on Word for
 * Mac 16.115: a floating table that reaches past the bottom margin sends the
 * page's last paragraph to a second page, and bands ending 0.05 in above it
 * stayed on one page with a three-line title.
 */
export const BOTTOM_SLACK = 0.05;

/** Refuses bands that are inverted, overlap, or would spill onto a second page. */
export function assertFits(bands: readonly Band[], size: PageSize, margin: number): void {
  const floor = size.h - margin - BOTTOM_SLACK;
  let cursor = 0;
  for (const band of bands) {
    if (band.to <= band.from) throw new Error(`the band at ${band.from} ends before it starts`);
    if (band.from < cursor - EPSILON) {
      throw new Error(`the band at ${band.from} overlaps the one above`);
    }
    cursor = band.to;
  }
  if (cursor > floor + EPSILON) {
    throw new Error(
      `the text ends at ${cursor} in, past ${floor.toFixed(2)} in: Word would add a second page`,
    );
  }
}

/** A band with the empty space above it, both as heights in inches. */
export interface Placed<T extends Band> {
  readonly gap: number;
  readonly height: number;
  readonly band: T;
}

/** Walks the bands top to bottom, measuring the gap that separates each from the last. */
export function place<T extends Band>(bands: readonly T[]): Placed<T>[] {
  let cursor = bands[0]?.from ?? 0;
  return bands.map((band) => {
    const gap = Math.max(0, band.from - cursor);
    cursor = band.to;
    return { gap: gap > EPSILON ? gap : 0, height: band.to - band.from, band };
  });
}
