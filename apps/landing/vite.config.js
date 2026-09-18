import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const siteUrl = env.VITE_SITE_URL || 'https://cachink.mx';
  const plausibleDomain = env.VITE_PLAUSIBLE_DOMAIN || '';

  const plausibleSnippet = plausibleDomain
    ? `<script defer data-domain="${plausibleDomain}" src="https://plausible.io/js/script.js"></script>`
    : '';

  return {
    plugins: [react(), htmlEnvPlugin({ siteUrl, plausibleSnippet })],
    publicDir: 'public',
    build: {
      outDir: 'dist',
      assetsInlineLimit: 4096,
    },
  };
});

/** Replaces __SITE_URL__ and __PLAUSIBLE_SNIPPET__ placeholders in index.html */
function htmlEnvPlugin({ siteUrl, plausibleSnippet }) {
  return {
    name: 'html-env',
    transformIndexHtml(html) {
      return html
        .replace(/__SITE_URL__/g, siteUrl)
        .replace(/__PLAUSIBLE_SNIPPET__/g, plausibleSnippet);
    },
  };
}
