/**
 * Writes .lastmod.json — each route's last commit date — so a tree exported
 * without git (the deploy procedure in docs/plan/06-landing.md, L-04) still
 * dates its pages, schema and sitemap truthfully. Run it in the git checkout,
 * then copy the file into the export beside package.json.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROUTES } from '../src/routes.js';
import { LASTMOD_SNAPSHOT, lastmodMap } from './crawler-files.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const map = lastmodMap(root, ROUTES);
writeFileSync(resolve(root, LASTMOD_SNAPSHOT), `${JSON.stringify(map, null, 2)}\n`);
console.log(`✓  ${LASTMOD_SNAPSHOT}: ${Object.keys(map).length} routes`);
