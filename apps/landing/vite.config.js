import { fileURLToPath } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { ROUTES } from './src/routes.js';
import { lastmodFor } from './scripts/crawler-files.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const siteUrl = env.VITE_SITE_URL || 'https://xangarro.mx';
  const plausibleDomain = env.VITE_PLAUSIBLE_DOMAIN || '';

  const plausibleSnippet = plausibleDomain
    ? `<script defer data-domain="${plausibleDomain}" src="https://plausible.io/js/script.js"></script>`
    : '';

  // N-58: the conteo-por-estado beacon. Empty unless VITE_GEO_PIXEL_URL is
  // set, exactly like the Plausible snippet above — so the switch that turns
  // measurement on is an environment variable, not a code change, and it stays
  // off until the site publishes its aviso de privacidad.
  const geoPixelUrl = env.VITE_GEO_PIXEL_URL || '';
  const geoPixel = geoPixelUrl
    ? `<img src="${geoPixelUrl}" alt="" width="1" height="1" aria-hidden="true" loading="eager" referrerpolicy="no-referrer" decoding="async" style="position:absolute;width:1px;height:1px;opacity:0">`
    : '';

  return {
    plugins: [react(), htmlEnvPlugin({ siteUrl, plausibleSnippet, geoPixel }), lastmodPlugin()],
    publicDir: 'public',
    build: {
      outDir: 'dist',
      assetsInlineLimit: 4096,
    },
  };
});

/** Replaces __SITE_URL__, __PLAUSIBLE_SNIPPET__ and __GEO_PIXEL__ in index.html */
function htmlEnvPlugin({ siteUrl, plausibleSnippet, geoPixel }) {
  return {
    name: 'html-env',
    transformIndexHtml(html) {
      return html
        .replace(/__SITE_URL__/g, siteUrl)
        .replace(/__PLAUSIBLE_SNIPPET__/g, plausibleSnippet)
        .replace(/__GEO_PIXEL__/g, geoPixel);
    },
  };
}

/**
 * `virtual:lastmod` — each route's last commit date, `{ '/recursos/nif/': '2026-09-18', … }`.
 * The guides print it and put it in their Article schema; the prerender dates
 * the sitemap from the same map, so the page and the sitemap never disagree.
 */
function lastmodPlugin() {
  const id = 'virtual:lastmod';
  const resolved = `\0${id}`;
  return {
    name: 'lastmod',
    resolveId(source) {
      return source === id ? resolved : null;
    },
    load(source) {
      if (source !== resolved) return null;
      const today = new Date().toISOString().slice(0, 10);
      const map = Object.fromEntries(
        ROUTES.map((r) => [r.path, lastmodFor(root, r.sources, today)]),
      );
      return `export default ${JSON.stringify(map)};`;
    },
  };
}
