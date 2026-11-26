/**
 * Shoots a page's art to a 300 dpi PNG with the repo's own Chromium.
 *
 * The wordmark is fitted to an exact width in the page, on its glyphs, once
 * Anton has loaded; a page whose Anton did not load is refused, not shot in a
 * fallback face.
 */

import { chromium, type Browser } from 'playwright';

import { css, IN } from './art-parts.js';
import type { ArtPage } from './art-pages.js';

/** Runs in the page: fit every `[data-fit]` wordmark, then say whether Anton is there. */
const FIT = `document.fonts.ready.then(() => {
  for (const el of document.querySelectorAll('[data-fit]')) {
    el.style.fontSize = (100 * Number(el.dataset.fit)) / el.firstElementChild.offsetWidth + 'px';
  }
  return document.fonts.check("40px 'Anton'");
})`;

async function shoot(browser: Browser, art: ArtPage): Promise<Buffer> {
  const viewport = { width: Math.round(art.size.w * IN), height: Math.round(art.size.h * IN) };
  const tab = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  try {
    await tab.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${css()}</style></head><body>${art.html()}</body></html>`,
    );
    if ((await tab.evaluate(FIT)) !== true) throw new Error('Anton did not load');
    return await tab.screenshot({ type: 'png' });
  } finally {
    await tab.close();
  }
}

/** Opens one browser for as long as `use` needs pages drawn. */
export async function withArt<T>(
  use: (draw: (art: ArtPage) => Promise<Buffer>) => Promise<T>,
): Promise<T> {
  const browser = await chromium.launch();
  try {
    return await use((art) => shoot(browser, art));
  } finally {
    await browser.close();
  }
}
