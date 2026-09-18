/**
 * Prerender script — no extra dependencies beyond vite + react-dom.
 *
 * Steps:
 * 1. Build an SSR bundle from src/entry-server.jsx via Vite's JS API.
 * 2. For each route: call render(route), inject into the HTML template,
 *    substitute per-route <title>/<description>/<canonical>, and write
 *    to dist/<route>/index.html.
 * 3. Substitute the real domain into robots.txt and sitemap.xml.
 * 4. Smoke-test: assert each HTML contains its expected H1.
 */

import { build, loadEnv } from 'vite'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Load env so we can substitute the real domain into static files
const env = loadEnv('production', root, '')
const SITE_URL = (env.VITE_SITE_URL || 'https://xangarro.mx').replace(/\/$/, '')

// ── Route manifest ─────────────────────────────────────────────────────────
// Each entry drives: SSR render, output path, <title>, <meta description>,
// <link rel="canonical">, and the smoke-test assertion.
const ROUTES = [
  {
    path: '/',
    outDir: 'dist',
    title: 'Xangarro · Finanzas para emprendedores',
    description: 'Xangarro es la plataforma mexicana para llevar la caja de tu negocio. Registra ventas y egresos en segundos, ve cómo va tu negocio en pesos, y comparte estados financieros con tu contador.',
    smoke: 'Tu caja',
  },
  {
    path: '/recursos/',
    outDir: 'dist/recursos',
    title: 'Recursos para pequeños negocios · Xangarro',
    description: 'Guías prácticas sobre control de caja, estados financieros NIF y comparativas para dueños de pequeños negocios en México.',
    smoke: 'Guías para llevar mejor',
  },
  {
    path: '/recursos/sin-excel/',
    outDir: 'dist/recursos/sin-excel',
    title: 'Cómo llevar la caja de tu negocio sin Excel · Xangarro',
    description: 'Guía práctica para dueños de pequeños negocios en México que quieren dejar de usar hojas de cálculo y llevar un control de caja más rápido, preciso y sin errores.',
    smoke: 'Cómo llevar la caja',
  },
  {
    path: '/recursos/nif/',
    outDir: 'dist/recursos/nif',
    title: 'Estados financieros NIF: qué son y cómo generarlos sin ser contador · Xangarro',
    description: 'Guía en lenguaje simple sobre los estados financieros en formato NIF que solicitan los contadores y bancos en México, y cómo generarlos desde tu app de caja.',
    smoke: 'Estados financieros NIF',
  },
  {
    path: '/recursos/errores-caja/',
    outDir: 'dist/recursos/errores-caja',
    title: '5 errores comunes al registrar ventas en efectivo · Xangarro',
    description: 'Los errores más frecuentes que cometen los dueños de pequeños negocios al llevar el control de caja en efectivo, y cómo un sistema de registro simple los elimina.',
    smoke: '5 errores comunes',
  },
  {
    path: '/recursos/vs-excel/',
    outDir: 'dist/recursos/vs-excel',
    title: 'Xangarro vs hojas de cálculo: comparativa honesta · Xangarro',
    description: 'Comparación directa entre usar Excel o Google Sheets y una app de caja especializada para el control financiero de pequeños negocios en México.',
    smoke: 'comparativa honesta',
  },
]

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
  logLevel: 'warn',
})
console.log('SSR bundle complete.')

// ── 2. Load SSR module ─────────────────────────────────────────────────────
const serverBundle = pathToFileURL(resolve(root, 'dist/server/entry-server.js')).href
const { render } = await import(serverBundle)

// ── 3. Read base template ──────────────────────────────────────────────────
const distHtml = resolve(root, 'dist/index.html')
const baseTemplate = readFileSync(distHtml, 'utf-8')

if (!baseTemplate.includes('<!--ssr-outlet-->')) {
  console.error('✗  <!--ssr-outlet--> placeholder not found in dist/index.html')
  process.exit(1)
}

// ── 4. Render + write each route ───────────────────────────────────────────
const failures = []

for (const route of ROUTES) {
  const appHtml = render(route.path)

  // Inject rendered HTML
  let html = baseTemplate.replace('<!--ssr-outlet-->', appHtml)

  // Substitute per-route <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)

  // Substitute primary <meta name="description">
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${route.description}$2`
  )

  // Substitute <link rel="canonical">
  const canonicalUrl = `${SITE_URL}${route.path}`
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${canonicalUrl}$2`
  )

  // Substitute OG url + title + description
  html = html.replace(
    /(<meta property="og:url"\s+content=")[^"]*(")/,
    `$1${canonicalUrl}$2`
  )
  html = html.replace(
    /(<meta property="og:title"\s+content=")[^"]*(")/,
    `$1${route.title}$2`
  )
  html = html.replace(
    /(<meta property="og:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`
  )

  // Write file
  const outDir = resolve(root, route.outDir)
  mkdirSync(outDir, { recursive: true })
  const outFile = resolve(outDir, 'index.html')
  writeFileSync(outFile, html)

  // Smoke test
  if (!html.includes(route.smoke)) {
    failures.push(`✗  ${route.path} — expected "${route.smoke}" not found in output`)
    console.error(`✗  ${route.path} smoke-test FAILED (missing: "${route.smoke}")`)
  } else {
    console.log(`✓  ${route.path} → ${route.outDir}/index.html`)
  }
}

if (failures.length > 0) {
  console.error('\nPrerender smoke-tests failed:')
  failures.forEach(f => console.error(f))
  process.exit(1)
}

// ── 5. Substitute domain in static crawler files ───────────────────────────
const PLACEHOLDER = 'https://xangarro.mx'
for (const filename of ['robots.txt', 'sitemap.xml']) {
  const filePath = resolve(root, 'dist', filename)
  if (!existsSync(filePath)) continue
  const content = readFileSync(filePath, 'utf-8')
  if (content.includes(PLACEHOLDER) && SITE_URL !== PLACEHOLDER) {
    writeFileSync(filePath, content.replaceAll(PLACEHOLDER, SITE_URL))
    console.log(`✓  Updated ${filename} → ${SITE_URL}`)
  }
}

console.log(`\n✓  Prerender complete — ${ROUTES.length} routes written.`)
