/**
 * The crawler-facing files that are derived, not written: sitemap.xml from
 * the route manifest, llms.txt and llms-full.txt from the plan and FAQ data
 * the page renders. Called by prerender.mjs after the HTML is written.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Last commit date (YYYY-MM-DD) touching any of `sources`, or null when git cannot say. */
export function lastmodFor(root, sources) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...sources], {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

/** Where scripts/lastmod.mjs snapshots the map for a tree that has no git (a deploy export). */
export const LASTMOD_SNAPSHOT = '.lastmod.json';

/**
 * `{ route path → YYYY-MM-DD }` for every route: from git when the tree has
 * one, else from the snapshot, else today — the one map the pages, their
 * schema and the sitemap all read, so they never disagree.
 */
export function lastmodMap(root, routes, today = new Date().toISOString().slice(0, 10)) {
  const snapshotPath = resolve(root, LASTMOD_SNAPSHOT);
  const snapshot = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, 'utf-8')) : {};
  return Object.fromEntries(
    routes.map((r) => [r.path, lastmodFor(root, r.sources) ?? snapshot[r.path] ?? today]),
  );
}

/** Only the routes a crawler should index appear in the sitemap. */
export const indexable = (routes) => routes.filter((r) => r.index !== false);

export function buildSitemap(routes, siteUrl, lastmod) {
  const urls = indexable(routes).map((r) =>
    [
      '  <url>',
      `    <loc>${siteUrl}${r.path}</loc>`,
      `    <lastmod>${lastmod[r.path]}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      '  </url>',
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** Writes the three files into dist and returns what a caller should assert on. */
export function writeCrawlerFiles({
  root,
  siteUrl,
  routes,
  lastmod,
  buildLlmsTxt,
  buildLlmsFullTxt,
}) {
  const dist = resolve(root, 'dist');
  const files = {
    'sitemap.xml': buildSitemap(routes, siteUrl, lastmod),
    'llms.txt': buildLlmsTxt(siteUrl),
    'llms-full.txt': buildLlmsFullTxt(siteUrl),
  };
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(resolve(dist, name), content);
    console.log(`✓  ${name} generated`);
  }
  return files;
}

/** Every string in `needles` that `text` lacks, as one failure line each. */
const missing = (file, text, needles, label) =>
  needles.filter((n) => !text.includes(n)).map((n) => `✗  ${file} — missing ${label} ${n}`);

/**
 * The generated files must carry what the page carries: every route in the
 * sitemap, every plan and every FAQ question in the llms files, every
 * public profile in the full one.
 */
export function checkCrawlerFiles(files, { routes, siteUrl, planes, faq, profiles, authors }) {
  const full = files['llms-full.txt'];
  const nombres = planes.map((p) => p.nombre);
  return [
    ...missing(
      'sitemap.xml',
      files['sitemap.xml'],
      indexable(routes).map((r) => `<loc>${siteUrl}${r.path}</loc>`),
      'route',
    ),
    ...missing('llms.txt', files['llms.txt'], nombres, 'plan'),
    ...missing('llms-full.txt', full, nombres, 'plan'),
    ...missing(
      'llms-full.txt',
      full,
      faq.map(({ q }) => q),
      'FAQ',
    ),
    ...missing(
      'llms-full.txt',
      full,
      profiles.map((p) => p.url),
      'profile',
    ),
    ...missing(
      'llms-full.txt',
      full,
      authors.map((a) => a.name),
      'author',
    ),
  ];
}

/** Google shows about 60 characters of a title and 155 of a description; past that it cuts. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export function checkHeadLengths(routes) {
  return routes.flatMap((r) => [
    ...(r.title.length > TITLE_MAX
      ? [`✗  ${r.path} — title is ${r.title.length} chars (max ${TITLE_MAX})`]
      : []),
    ...(r.description.length > DESCRIPTION_MAX
      ? [`✗  ${r.path} — description is ${r.description.length} chars (max ${DESCRIPTION_MAX})`]
      : []),
  ]);
}

/** A featured snippet or voice answer lifts about 60 words; a longer FAQ answer is never picked whole. */
export const FAQ_ANSWER_MAX_WORDS = 60;

export function checkFaqLengths(faq) {
  return faq
    .map(({ q, a }) => ({ q, n: a.trim().split(/\s+/).length }))
    .filter(({ n }) => n > FAQ_ANSWER_MAX_WORDS)
    .map(({ q, n }) => `✗  FAQ "${q}" — answer is ${n} words (max ${FAQ_ANSWER_MAX_WORDS})`);
}
