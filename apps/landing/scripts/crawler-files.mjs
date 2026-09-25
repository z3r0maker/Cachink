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

/**
 * The generated files must carry what the page carries: every route in the
 * sitemap, every plan and every FAQ question in the llms files.
 */
export function checkCrawlerFiles(files, { routes, siteUrl, planes, faq }) {
  const failures = [];
  for (const r of routes) {
    if (!files['sitemap.xml'].includes(`<loc>${siteUrl}${r.path}</loc>`)) {
      failures.push(`✗  sitemap.xml — missing ${r.path}`);
    }
  }
  for (const p of planes) {
    for (const name of ['llms.txt', 'llms-full.txt']) {
      if (!files[name].includes(p.nombre)) failures.push(`✗  ${name} — missing plan ${p.nombre}`);
    }
  }
  for (const { q } of faq) {
    if (!files['llms-full.txt'].includes(q)) failures.push(`✗  llms-full.txt — missing FAQ "${q}"`);
  }
  return failures;
}
