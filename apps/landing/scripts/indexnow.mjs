/**
 * Pings IndexNow with every indexable route after a production deploy, so
 * Bing (and the engines that share the protocol) fetch the new pages now
 * rather than on their next crawl. Google does not use IndexNow; its
 * Search Console "Request indexing" is the manual equivalent.
 *
 * Run after `vercel promote`:  node apps/landing/scripts/indexnow.mjs
 */
import { INDEXNOW_KEY } from '../landing/indexnow.js';
import { ROUTES } from '../src/routes.js';
import { indexable } from './crawler-files.mjs';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://xangarro.mx').replace(/\/$/, '');
const host = new URL(SITE_URL).host;
const urlList = indexable(ROUTES).map((r) => `${SITE_URL}${r.path}`);

const proof = await fetch(`${SITE_URL}/${INDEXNOW_KEY}.txt`);
if (!proof.ok || (await proof.text()).trim() !== INDEXNOW_KEY) {
  console.error(`✗  ${SITE_URL}/${INDEXNOW_KEY}.txt does not serve the key — deploy first`);
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  }),
});
// 200 = received, 202 = received and the key will be validated later
console.log(`${res.ok ? '✓' : '✗'}  IndexNow ${res.status} for ${urlList.length} URLs`);
if (!res.ok) process.exit(1);
