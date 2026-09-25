/**
 * The social card as an HTML page, 1200×630, in the landing's visual language:
 * the brand row, a headline, a line under it and the domain — plus, on the
 * site's card, the browser-window sketch from the hero. The two self-hosted
 * fonts are inlined so the page renders the same on any machine.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FONTS } from './fonts.mjs';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fontFace = (family, weight, pkgFile) =>
  `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;` +
  `src:url(data:font/woff2;base64,${readFileSync(require.resolve(pkgFile)).toString('base64')}) format('woff2')}`;

const FONT_CSS = [
  fontFace('Plus Jakarta Sans', '200 800', FONTS[0][0]),
  fontFace('Anton', '400', FONTS[1][0]),
].join('\n');

const CARD_CSS = readFileSync(resolve(here, 'og-card.css'), 'utf8');

const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';

// The coin is the brand mark (X-07), read from the master, never redrawn here.
const MARK = readFileSync(
  resolve(here, '../../../assets/brand/icons/mark-flat.svg'),
  'utf8',
).trim();

const brand = () => `
  <div class="brand">
    <span class="coin">${MARK}</span>
    <span class="wm">Xangarro!</span>
  </div>`;

/** The portal, sketched like the hero's browser window: today's caja, and the week. */
const browserMock = () => `
  <div class="bw">
    <div class="bw-top"><span class="bw-dot"></span><span class="bw-dot"></span><span class="bw-dot"></span><span class="bw-url">app.xangarro.mx</span></div>
    <div class="bw-main">
      <div class="bw-greet"><span class="bw-hi">Hola, Lupita</span><span class="bw-date">Hoy · 4:10 pm</span></div>
      <div class="bw-grid">
        <div class="bw-hero">
          <span class="bw-label">Caja de hoy</span>
          <span class="bw-big">$12,480</span>
          <span class="bw-verdict"><span class="bw-vdot"></span>Cuadra con el efectivo</span>
          <span class="bw-live">● En vivo desde el mostrador</span>
        </div>
        <div class="bw-card">
          <span class="bw-label">Esta semana</span>
          <div class="bw-bars">
            ${[52, 70, 46, 88, 64, 96, 78].map((h, i) => `<span class="bw-bar${i === 6 ? ' today' : ''}" style="height:${h}%"></span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;

const checks = (items) =>
  `<ul class="checks">${items.map((c) => `<li>${CHECK}${esc(c)}</li>`).join('')}</ul>`;

/**
 * `headline` is HTML (it may carry the yellow highlight span); everything else
 * is text. `mock: true` draws the browser window beside the copy.
 */
export function ogCardHtml({
  tag,
  headline,
  guide = false,
  sub,
  mock = false,
  checks: items = [],
}) {
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8">
<style>${FONT_CSS}\n${CARD_CSS}</style></head>
<body><div class="card">
  ${brand()}
  <div class="body">
    <div class="copy${mock ? '' : ' wide'}">
      <span class="tag"><span class="dot"></span>${esc(tag)}</span>
      <h1 class="h1${guide ? ' guide' : ''}">${headline}</h1>
      <p class="sub">${esc(sub)}</p>
    </div>
    ${mock ? browserMock() : ''}
  </div>
  <div class="foot"><span class="url">xangarro.mx</span>${checks(items)}</div>
</div></body></html>`;
}
