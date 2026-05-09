/**
 * Prerender script — no extra dependencies beyond vite + react-dom.
 *
 * Steps:
 * 1. Build an SSR bundle from src/entry-server.jsx via Vite's JS API.
 * 2. Import the SSR bundle and call render() to get an HTML string.
 * 3. Inject it into dist/index.html at the <!--ssr-outlet--> placeholder.
 */

import { build, loadEnv } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Load env so we can substitute the real domain into static files
const env = loadEnv('production', root, '')
const SITE_URL = env.VITE_SITE_URL || 'https://cachink.mx'

// ── 1. Build SSR bundle ────────────────────────────────────────────────────
console.log('Building SSR bundle…')
await build({
  root,
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: 'dist/server',
    rollupOptions: {
      output: { format: 'esm' },
    },
  },
  // suppress the "use client" / SSR warnings for our inline-style components
  logLevel: 'warn',
})
console.log('SSR bundle complete.')

// ── 2. Render to string ────────────────────────────────────────────────────
const serverBundle = pathToFileURL(resolve(root, 'dist/server/entry-server.js')).href
const { render } = await import(serverBundle)
const appHtml = render()

// ── 3. Inject into index.html ──────────────────────────────────────────────
const distHtml = resolve(root, 'dist/index.html')
const template = readFileSync(distHtml, 'utf-8')

if (!template.includes('<!--ssr-outlet-->')) {
  console.error('✗  <!--ssr-outlet--> placeholder not found in dist/index.html')
  process.exit(1)
}

writeFileSync(distHtml, template.replace('<!--ssr-outlet-->', appHtml))
console.log('✓  Prerendered dist/index.html — crawlers now see full page content.')

// ── 4. Substitute domain in static crawler files ───────────────────────────
const PLACEHOLDER = 'https://cachink.mx'
for (const filename of ['robots.txt', 'sitemap.xml']) {
  const filePath = resolve(root, 'dist', filename)
  if (!existsSync(filePath)) continue
  const content = readFileSync(filePath, 'utf-8')
  if (content.includes(PLACEHOLDER) && SITE_URL !== PLACEHOLDER) {
    writeFileSync(filePath, content.replaceAll(PLACEHOLDER, SITE_URL))
    console.log(`✓  Updated ${filename} → ${SITE_URL}`)
  }
}
