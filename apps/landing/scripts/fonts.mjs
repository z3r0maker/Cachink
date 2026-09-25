/**
 * Copies the two self-hosted fonts from their packages into public/fonts,
 * so the page loads them from its own origin: no Google Fonts round trip,
 * no render-blocking stylesheet, no preload URL that can rot (the old
 * gstatic hash 404'd on every visit). Runs before `vite build` and `vite`.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/fonts');

/** Package file → public name. The latin subset covers Spanish (á é í ó ú ñ ¿ ¡). */
export const FONTS = [
  [
    '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
    'plus-jakarta-sans-latin-wght.woff2',
  ],
  ['@fontsource/anton/files/anton-latin-400-normal.woff2', 'anton-latin-400.woff2'],
];

mkdirSync(out, { recursive: true });
for (const [pkgFile, name] of FONTS) {
  copyFileSync(require.resolve(pkgFile), resolve(out, name));
}
console.log(`✓  ${FONTS.length} fonts → public/fonts`);
