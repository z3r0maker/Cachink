/**
 * Generates the social preview images (1200×630, PNG + WebP):
 *   public/og-image.*        — the site's card
 *   public/og/<slug>.*       — one card per guide, from src/articles.js
 *
 * The card is an HTML page (og-card.mjs) screenshotted by Playwright's
 * Chromium with the site's own fonts inlined, so it renders the same on any
 * machine. Committed, not built on deploy: re-run this after changing the
 * card or adding a guide; the prerender fails when a guide's card is missing.
 *
 * Run:  node scripts/generate-og.mjs
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARTICLES } from '../src/articles.js';
import { ogCardHtml } from './og-card.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKS = ['Gratis para siempre', 'Sin tarjeta', 'En español y en pesos'];

const CARDS = [
  [
    'public/og-image',
    {
      tag: 'Beta abierta · el portal web de tu negocio',
      headline: 'El mostrador cobra.<br><span class="hl">Tú ves todo.</span>',
      sub: 'Caja, punto de venta y estados financieros NIF para tu negocio, desde el navegador.',
      mock: true,
      checks: CHECKS,
    },
  ],
  ...ARTICLES.map((a) => [
    `public/og/${a.slug}`,
    {
      tag: `${a.badge} · lectura de ${a.readTime}`,
      headline: a.title,
      guide: true,
      sub: a.description,
      checks: ['Guía gratuita', 'Para pequeños negocios en México'],
    },
  ]),
];

const kb = (f) => (statSync(f).size / 1024).toFixed(0);

async function write(page, base, card) {
  await page.setContent(ogCardHtml(card), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  await sharp(png).png({ compressionLevel: 9, palette: true }).toFile(`${base}.png`);
  await sharp(png).webp({ quality: 82 }).toFile(`${base}.webp`);
  console.log(
    `✓  ${base.replace(root, '')}.png ${kb(`${base}.png`)} KB · .webp ${kb(`${base}.webp`)} KB`,
  );
}

mkdirSync(resolve(root, 'public/og'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const [base, card] of CARDS) await write(page, resolve(root, base), card);
await browser.close();
