/**
 * The pieces a page's art is drawn from, as HTML for the browser in `art.ts`.
 *
 * All copy is live text in the .docx. The only glyphs drawn here are the
 * wordmark's, set in Anton as the product sets it. The lockup's proportions are
 * the landing's (`apps/landing/scripts/og-card.css`): coin 44, border 2.5,
 * shadow 3, gap 12, wordmark 34, tracking -0.005em, mark 57.
 */

import { colors } from '../../packages/tokens/src/index.js';

import { antonWoff2, markFlat, sized, type PageSize } from './sources.js';

/** Px per inch of the layout; the browser shoots at ×2, which gives 300 dpi. */
export const IN = 150;
const px = (inches: number): string => `${inches * IN}px`;

/** The lockup's own unit: everything in it scales with the coin's 44. */
const COIN = 44;

export const css = (): string => `
@font-face{font-family:'Anton';font-weight:400;font-style:normal;src:url(data:font/woff2;base64,${antonWoff2().toString('base64')}) format('woff2')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden}
.page{position:relative;overflow:hidden}
.abs{position:absolute}
.lockup{position:absolute;display:flex;align-items:center}
.coin{flex:none;border-radius:9999px;background:${colors.yellow};display:flex;align-items:center;justify-content:center;overflow:hidden}
.coin svg{flex:none}
.wm{font-family:Anton,sans-serif;text-transform:uppercase;letter-spacing:-0.005em;line-height:.92;white-space:nowrap}
`;

/** The flat brand coin, `d` px across; `edge` adds the border and the hard shadow. */
export function coin(d: number, edge = true): string {
  const k = d / COIN;
  const shadow = `${3 * k}px ${3 * k}px 0 ${colors.black}`;
  const style = edge ? `border:${2.5 * k}px solid ${colors.black};box-shadow:${shadow};` : '';
  return `<span class="coin" style="width:${d}px;height:${d}px;${style}">${sized(markFlat(), 57 * k)}</span>`;
}

interface Lockup {
  /** Inches from the page's top edge. */
  readonly y: number;
  /** Inches from the left edge; left out, the lockup is centred on the page. */
  readonly x?: number;
  /** The coin's diameter, in px. */
  readonly d: number;
  /** On a dark ground: white wordmark, coin without its edge. */
  readonly light?: boolean;
}

/** The brand row: the coin and the wordmark. */
export function lockup({ x, y, d, light = false }: Lockup): string {
  const k = d / COIN;
  const where =
    x === undefined
      ? `left:0;width:100%;justify-content:center;top:${px(y)}`
      : `left:${px(x)};top:${px(y)}`;
  const ink = light ? colors.white : colors.black;
  return `<div class="lockup" style="${where};gap:${12 * k}px">
    ${coin(d, !light)}
    <span class="wm" style="font-size:${34 * k}px;color:${ink}">Xangarro!</span>
  </div>`;
}

/** A box, placed in inches. */
export const rect = (x: number, y: number, w: number, h: number, style: string): string =>
  `<div class="abs" style="left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)};${style}"></div>`;

/** A horizontal rule, `t` px thick. */
export const hrule = (
  x: number,
  y: number,
  w: number,
  t = 4,
  color: string = colors.black,
): string =>
  `<div class="abs" style="left:${px(x)};top:${px(y)};width:${px(w)};height:${t}px;background:${color}"></div>`;

/** The short yellow bar with a black edge. */
export const accent = (x: number, y: number): string =>
  rect(x, y, 1.15, 0.17, `background:${colors.yellow};border:3px solid ${colors.black}`);

/** The card: white, black edge, hard shadow. */
export const card = (x: number, y: number, w: number, h: number): string =>
  rect(
    x,
    y,
    w,
    h,
    `background:${colors.white};border:4px solid ${colors.black};border-radius:24px;box-shadow:8px 8px 0 ${colors.black}`,
  );

/** The wordmark alone, centred on the page and `w` inches wide (`art.ts` fits it). */
export const wordmark = (y: number, w: number): string =>
  `<div class="abs wm" data-fit="${w * IN}" style="left:0;top:${px(y)};width:100%;text-align:center;color:${colors.black};font-size:100px"><span>Xangarro!</span></div>`;

/** An absolutely placed slot, in inches, for a piece that sizes itself. */
export const at = (x: number, y: number, inner: string, style = ''): string =>
  `<div class="abs" style="left:${px(x)};top:${px(y)};${style}">${inner}</div>`;

export const page = (size: PageSize, background: string, body: string): string =>
  `<div class="page" style="width:${px(size.w)};height:${px(size.h)};background:${background}">${body}</div>`;
