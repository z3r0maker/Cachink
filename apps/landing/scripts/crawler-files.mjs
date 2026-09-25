/**
 * The crawler-facing files that are derived, not written: sitemap.xml from
 * the route manifest, llms.txt and llms-full.txt from the plan and FAQ data
 * the page renders. Called by prerender.mjs after the HTML is written.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Last commit date (YYYY-MM-DD) touching any of `sources`; today when git cannot say. */
export function lastmodFor(root, sources, today) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...sources], {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : today;
  } catch {
    return today;
  }
}

export function buildSitemap(routes, siteUrl, root, today = new Date().toISOString().slice(0, 10)) {
  const urls = routes.map((r) => {
    const lastmod = lastmodFor(root, r.sources, today);
    return [
      '  <url>',
      `    <loc>${siteUrl}${r.path}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      '  </url>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** Writes the three files into dist and returns what a caller should assert on. */
export function writeCrawlerFiles({ root, siteUrl, routes, buildLlmsTxt, buildLlmsFullTxt }) {
  const dist = resolve(root, 'dist');
  const files = {
    'sitemap.xml': buildSitemap(routes, siteUrl, root),
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
export function checkCrawlerFiles(files, { routes, siteUrl, planes, faq, profiles }) {
  const full = files['llms-full.txt'];
  const nombres = planes.map((p) => p.nombre);
  return [
    ...missing(
      'sitemap.xml',
      files['sitemap.xml'],
      routes.map((r) => `<loc>${siteUrl}${r.path}</loc>`),
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
  ];
}
