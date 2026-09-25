/**
 * Generates the social preview images (1200×630, PNG + WebP):
 *   public/og-image.*        — the site's card
 *   public/og/<slug>.*       — one card per guide, from src/articles.js
 *
 * The coin on every card is the brand mark (X-07), read by og-card.mjs.
 * Committed, not built on deploy: the card is rasterised with the machine's
 * Plus Jakarta Sans, which the build server does not have. Re-run this after
 * adding or renaming a guide; the prerender fails when a guide's card is
 * missing. The favicons and site.webmanifest come from assets/brand/icons/.
 *
 * Run:  node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARTICLES } from '../src/articles.js';
import { ogCardSvg, wrapTitle } from './og-card.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FOOTER = 'xangarro.mx · Tu negocio sigue aunque se vaya el internet';

async function write(base, svg) {
  const buf = Buffer.from(svg);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(`${base}.png`);
  await sharp(buf).webp({ quality: 82 }).toFile(`${base}.webp`);
  const kb = (f) => (statSync(f).size / 1024).toFixed(0);
  console.log(
    `✓  ${base.replace(root, '')}.png ${kb(`${base}.png`)} KB · .webp ${kb(`${base}.webp`)} KB`,
  );
}

await write(
  resolve(root, 'public/og-image'),
  ogCardSvg({
    eyebrow: '¡XANGARRO! · FINANZAS CLARAS',
    lines: ['Tu caja,', 'clara.'],
    sub: 'Registra ventas y egresos en segundos.',
    footer: FOOTER,
  }),
);

mkdirSync(resolve(root, 'public/og'), { recursive: true });
for (const a of ARTICLES) {
  await write(
    resolve(root, 'public/og', a.slug),
    ogCardSvg({
      eyebrow: `¡XANGARRO! · ${a.badge.toUpperCase()}`,
      lines: wrapTitle(a.title),
      sub: `Guía de ${a.readTime} para pequeños negocios`,
      footer: FOOTER,
    }),
  );
}
