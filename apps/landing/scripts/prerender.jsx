/**
 * Post-build prerender script (run with: npx vite-node scripts/prerender.jsx)
 *
 * 1. Reads dist/index.html (produced by `vite build`)
 * 2. Renders the React App to a static HTML string via react-dom/server
 * 3. Injects the HTML into the <!--ssr-outlet--> placeholder
 * 4. Writes the result back to dist/index.html
 *
 * Crawlers (Googlebot, GPTBot, ClaudeBot, PerplexityBot) that don't execute
 * JavaScript will now see fully-rendered page content instead of an empty
 * <div id="root">.
 */

import { renderToString } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import App from '../src/App.jsx';

const distHtml = resolve(process.cwd(), 'dist/index.html');

let template;
try {
  template = readFileSync(distHtml, 'utf-8');
} catch {
  console.error('✗ dist/index.html not found — run `vite build` first');
  process.exit(1);
}

const appHtml = renderToString(<App />);

if (!template.includes('<!--ssr-outlet-->')) {
  console.error('✗ <!--ssr-outlet--> placeholder missing from index.html');
  process.exit(1);
}

const result = template.replace('<!--ssr-outlet-->', appHtml);
writeFileSync(distHtml, result);

console.log('✓ Prerendered dist/index.html — crawlers now see full page content');
