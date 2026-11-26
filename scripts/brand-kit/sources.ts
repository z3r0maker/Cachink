/**
 * Where the brand's originals live.
 *
 * Nothing in this folder redraws the logo or retypes a colour. The coin is read
 * from the icon masters (`assets/brand/icons`), the palette from
 * `@xangarro/tokens`, the text face from the comprobante's fonts, and the
 * wordmark's face from the landing's `@fontsource/anton`.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

export const ROOT = join(import.meta.dirname, '..', '..');

/** A page, in inches. */
export interface PageSize {
  readonly w: number;
  readonly h: number;
}

export const LETTER: PageSize = { w: 8.5, h: 11 };
/** A letter-size paper folder, closed: 23.5 × 29.5 cm, the size the owner confirmed. */
export const FOLDER: PageSize = { w: 23.5 / 2.54, h: 29.5 / 2.54 };

/**
 * The text face (`typography.fontFamily`). Its 800 weight is a family of its own
 * in the static files, which is how Word addresses it.
 */
export const SANS = 'Plus Jakarta Sans';
export const SANS_EXTRABOLD = 'Plus Jakarta Sans ExtraBold';

const icon = (name: string): string =>
  readFileSync(join(ROOT, 'assets/brand/icons', name), 'utf8').trim();

/** The flat mark: the yellow disc and the X. */
export const markFlat = (): string => icon('mark-flat.svg');

/** The black square behind the coin in the app icon's master. */
const ICON_SQUARE = '<path fill="#111111" d="M0 0H1024V1024H0Z"/>';

/**
 * The detailed coin: the app icon's master without its square, which is how
 * the approved splash board shows it on yellow.
 */
export function coinDetailed(): string {
  const master = icon('coin-master.svg');
  if (!master.includes(ICON_SQUARE)) {
    throw new Error('coin-master.svg no longer starts from the black square this strips');
  }
  return master.replace(ICON_SQUARE, '');
}

/** Both masters are drawn on a 1024 box; this sets the size they render at, in px. */
export function sized(svg: string, px: number): string {
  const BOX = 'width="1024" height="1024"';
  if (!svg.includes(BOX)) throw new Error('the master is no longer a 1024 × 1024 box');
  return svg.replace(BOX, `width="${px}" height="${px}"`);
}

/** Anton belongs to the landing, which is the only workspace that declares it. */
const landing = createRequire(join(ROOT, 'apps/landing/package.json'));

/** The wordmark's face, for the browser that draws the art. */
export const antonWoff2 = (): Buffer =>
  readFileSync(landing.resolve('@fontsource/anton/files/anton-latin-400-normal.woff2'));

/** The text face, as the static TTF Word can embed (OFL, embedding allowed). */
export const sansTtf = (weight: 400 | 700 | 800): Buffer =>
  readFileSync(
    join(ROOT, 'apps/web/assets/comprobante-fonts/fonts', `PlusJakartaSans-${weight}.ttf`),
  );
