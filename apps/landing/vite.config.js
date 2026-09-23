import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react(), htmlEnvPlugin({ siteUrl, plausibleSnippet, geoPixel })],
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
