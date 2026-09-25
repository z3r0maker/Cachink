/**
 * Prerender script — no extra dependencies beyond vite + react-dom.
 *
 * Steps:
 * 1. Build an SSR bundle from src/entry-server.jsx via Vite's JS API.
 * 2. For each route: call render(route), inject into the HTML template,
 *    substitute per-route <title>/<description>/<canonical>, and write
 *    to dist/<route>/index.html.
 * 3. Generate sitemap.xml, llms.txt and llms-full.txt from the same data
 *    the pages render (src/routes.js, landing/planes.js, landing/copy.jsx),
 *    and substitute the real domain into robots.txt.
 * 4. Smoke-test: assert each HTML contains its expected H1, and that the
 *    generated files carry every route, plan and FAQ question.
 */

import { build, loadEnv } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ROUTES } from '../src/routes.js';
import { PLANES } from '../landing/planes.js';
import { ARTICLE_BY_SLUG, ogImagePath } from '../src/articles.js';
import { SOCIAL_PROFILES } from '../landing/social.js';
import { AUTHORS } from '../landing/authors.js';
import {
  checkCrawlerFiles,
  checkFaqLengths,
  checkHeadLengths,
  writeCrawlerFiles,
} from './crawler-files.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load env so we can substitute the real domain into static files
const env = loadEnv('production', root, '');
const SITE_URL = (env.VITE_SITE_URL || 'https://xangarro.mx').replace(/\/$/, '');

// ── 1. Build SSR bundle ────────────────────────────────────────────────────
console.log('Building SSR bundle…');
await build({
  root,
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: 'dist/server',
    rollupOptions: {
      output: { format: 'esm' },
    },
  },
  logLevel: 'warn',
});
console.log('SSR bundle complete.');

// ── 2. Load SSR module ─────────────────────────────────────────────────────
const serverBundle = pathToFileURL(resolve(root, 'dist/server/entry-server.js')).href;
const { render, buildLlmsTxt, buildLlmsFullTxt, FAQ_ITEMS, lastmod } = await import(serverBundle);

// ── 3. Read base template ──────────────────────────────────────────────────
const distHtml = resolve(root, 'dist/index.html');
const baseTemplate = readFileSync(distHtml, 'utf-8');

if (!baseTemplate.includes('<!--ssr-outlet-->')) {
  console.error('✗  <!--ssr-outlet--> placeholder not found in dist/index.html');
  process.exit(1);
}

// ── 4. Render + write each route ───────────────────────────────────────────
const failures = [];

for (const route of ROUTES) {
  const appHtml = render(route.path);

  // Inject rendered HTML
  let html = baseTemplate.replace('<!--ssr-outlet-->', appHtml);

  // Substitute per-route <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Substitute primary <meta name="description">
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${route.description}$2`);

  // Substitute <link rel="canonical">
  const canonicalUrl = `${SITE_URL}${route.path}`;
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonicalUrl}$2`);

  // Substitute OG url + title + description
  html = html.replace(/(<meta property="og:url"\s+content=")[^"]*(")/, `$1${canonicalUrl}$2`);
  html = html.replace(/(<meta property="og:title"\s+content=")[^"]*(")/, `$1${route.title}$2`);
  html = html.replace(
    /(<meta property="og:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  );
  html = html.replace(/(<meta property="og:type"\s+content=")[^"]*(")/, `$1${route.type}$2`);

  // Substitute the Twitter card title + description
  html = html.replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/, `$1${route.title}$2`);
  html = html.replace(
    /(<meta name="twitter:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  );

  // A guide gets its own social card (generated into public/og/ by generate-og.mjs)
  const slug = route.path.match(/^\/recursos\/([a-z-]+)\/$/)?.[1];
  const article = slug && ARTICLE_BY_SLUG[slug];
  if (article) {
    for (const ext of ['webp', 'png']) {
      const file = resolve(root, 'public', ogImagePath(slug, ext).slice(1));
      if (!existsSync(file))
        failures.push(
          `✗  ${route.path} — missing social card ${file}; run scripts/generate-og.mjs`,
        );
      html = html.replaceAll(`${SITE_URL}/og-image.${ext}`, `${SITE_URL}${ogImagePath(slug, ext)}`);
    }
    html = html.replaceAll('Xangarro — El mostrador cobra. Tú ves todo.', `${article.title} · Xangarro`);
  }

  // A page that must not be indexed (the 404) says so and carries no canonical
  if (route.index === false) {
    html = html.replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex">');
  }

  // Write file
  const outDir = resolve(root, route.outDir);
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, route.outFile ?? 'index.html');
  writeFileSync(outFile, html);

  // Smoke test
  for (const text of route.absent ?? []) {
    if (html.includes(text)) failures.push(`✗  ${route.path} — must not publish "${text}"`);
  }
  if (!html.includes(route.smoke)) {
    failures.push(`✗  ${route.path} — expected "${route.smoke}" not found in output`);
    console.error(`✗  ${route.path} smoke-test FAILED (missing: "${route.smoke}")`);
  } else {
    console.log(`✓  ${route.path} → ${route.outDir}/${route.outFile ?? 'index.html'}`);
  }
}

if (failures.length > 0) {
  console.error('\nPrerender smoke-tests failed:');
  failures.forEach((f) => console.error(f));
  process.exit(1);
}

// ── 5. Generated crawler files + robots domain ─────────────────────────────
const files = writeCrawlerFiles({
  root,
  siteUrl: SITE_URL,
  routes: ROUTES,
  lastmod,
  buildLlmsTxt,
  buildLlmsFullTxt,
});
const crawlerFailures = [...checkHeadLengths(ROUTES), ...checkFaqLengths(FAQ_ITEMS)];
crawlerFailures.push(
  ...checkCrawlerFiles(files, {
    routes: ROUTES,
    siteUrl: SITE_URL,
    planes: PLANES,
    faq: FAQ_ITEMS,
    profiles: SOCIAL_PROFILES,
    authors: AUTHORS,
  }),
);
if (crawlerFailures.length > 0) {
  console.error('\nGenerated crawler files failed their checks:');
  crawlerFailures.forEach((f) => console.error(f));
  process.exit(1);
}

const PLACEHOLDER = 'https://xangarro.mx';
const robotsPath = resolve(root, 'dist', 'robots.txt');
if (existsSync(robotsPath)) {
  const content = readFileSync(robotsPath, 'utf-8');
  if (content.includes(PLACEHOLDER) && SITE_URL !== PLACEHOLDER) {
    writeFileSync(robotsPath, content.replaceAll(PLACEHOLDER, SITE_URL));
    console.log(`✓  Updated robots.txt → ${SITE_URL}`);
  }
}

console.log(`\n✓  Prerender complete — ${ROUTES.length} routes written.`);
