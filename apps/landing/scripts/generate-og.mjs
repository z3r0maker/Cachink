/**
 * Generates public/og-image.png (1200×630) — the Open Graph / Twitter Card
 * social preview image — plus the favicon and apple-touch-icon placeholders
 * and site.webmanifest for Xangarro (L-01: text wordmark until X-07 artwork).
 *
 * Design: neobrutalist yellow card — brand yellow background, hard black
 * border, "XANGARRO!" wordmark, hero headline, and a black footer bar.
 * Matches the landing page's visual language exactly.
 *
 * Run:  node scripts/generate-og.mjs
 */

import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT     = resolve(__dirname, '../public/og-image.png')
const OUT_WEBP = resolve(__dirname, '../public/og-image.webp')
const OUT_FAV  = resolve(__dirname, '../public/assets/favicon-32.png')
const OUT_TOUCH = resolve(__dirname, '../public/assets/apple-touch-icon.png')
const OUT_MANIFEST = resolve(__dirname, '../public/site.webmanifest')

const W = 1200
const H = 630
const BORDER = 12        // outer border width
const SHADOW = 16        // hard offset shadow

// ── SVG template ──────────────────────────────────────────────────────────
// Encoded as a string so sharp can rasterise it via libvips.
// All values from colors_and_type.css / §8 of the design system.
const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     xmlns="http://www.w3.org/2000/svg"
     style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <!-- Hard shadow (offset black rect behind the card) -->
  <rect
    x="${BORDER + SHADOW}" y="${BORDER + SHADOW}"
    width="${W - BORDER * 2 - SHADOW}" height="${H - BORDER * 2 - SHADOW}"
    fill="#0D0D0D"
    rx="24"
  />

  <!-- Main card — brand yellow -->
  <rect
    x="${BORDER}" y="${BORDER}"
    width="${W - BORDER * 2 - SHADOW}" height="${H - BORDER * 2 - SHADOW}"
    fill="#FFD60A"
    stroke="#0D0D0D" stroke-width="${BORDER}"
    rx="24"
  />

  <!-- Black footer bar -->
  <rect
    x="${BORDER}" y="${H - BORDER - SHADOW - 100}"
    width="${W - BORDER * 2 - SHADOW}" height="100"
    fill="#0D0D0D"
    rx="0"
  />
  <!-- Round bottom corners of footer bar to match card -->
  <rect
    x="${BORDER}" y="${H - BORDER - SHADOW - 100}"
    width="${W - BORDER * 2 - SHADOW}" height="50"
    fill="#0D0D0D"
  />
  <rect
    x="${BORDER}" y="${H - BORDER - SHADOW - 50}"
    width="${W - BORDER * 2 - SHADOW}" height="50"
    fill="#0D0D0D"
    rx="24"
  />

  <!-- Top-left: ¡XANGARRO! eyebrow label -->
  <text
    x="68" y="100"
    font-size="18" font-weight="800" fill="#0D0D0D"
    letter-spacing="4" text-transform="uppercase"
    style="text-transform:uppercase; letter-spacing: 0.2em;"
  >¡XANGARRO! · FINANZAS CLARAS</text>

  <!-- Coin logo mark -->
  <circle cx="68" cy="155" r="42" fill="#0D0D0D" />
  <circle cx="68" cy="155" r="34" fill="#FFD60A" />
  <text x="68" y="165" font-size="28" font-weight="900" fill="#0D0D0D"
        text-anchor="middle" dominant-baseline="middle">$</text>

  <!-- Hero headline -->
  <text x="68" y="270"
        font-size="96" font-weight="900" fill="#0D0D0D"
        letter-spacing="-3">Tu caja,</text>
  <text x="68" y="376"
        font-size="96" font-weight="900" fill="#0D0D0D"
        letter-spacing="-3">clara.</text>

  <!-- Sub-headline -->
  <text x="68" y="440"
        font-size="28" font-weight="600" fill="#1A1A18"
        letter-spacing="-0.5">Registra ventas y egresos en segundos.</text>

  <!-- Footer bar content -->
  <text
    x="68" y="${H - BORDER - SHADOW - 38}"
    font-size="20" font-weight="700" fill="#FFD60A"
    letter-spacing="1"
  >xangarro.mx · Tu negocio sigue aunque se vaya el internet</text>

  <!-- Right-side accent: large $ coin -->
  <circle cx="980" cy="290" r="180" fill="#0D0D0D" opacity="0.08" />
  <circle cx="980" cy="290" r="155" fill="#0D0D0D" opacity="0.06" />
  <text x="980" y="340"
        font-size="160" font-weight="900" fill="#0D0D0D" opacity="0.18"
        text-anchor="middle" dominant-baseline="middle">$</text>

</svg>
`.trim()

const svgBuffer = Buffer.from(svg)

// PNG (required by some OG parsers that don't accept WebP)
await sharp(svgBuffer)
  .png({ compressionLevel: 9, palette: false })
  .toFile(OUT)

// WebP — ~60% smaller, used by modern crawlers and social platforms
await sharp(svgBuffer)
  .webp({ quality: 82 })
  .toFile(OUT_WEBP)

// ── Favicon + apple-touch-icon placeholders (L-01: yellow tile, black X) ──
const icon = (size, rx) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
     xmlns="http://www.w3.org/2000/svg"
     style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;">
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}"
        fill="#FFD60A" stroke="#0D0D0D" stroke-width="4" rx="${rx}" />
  <text x="50%" y="54%" font-size="${size * 0.62}" font-weight="900" fill="#0D0D0D"
        text-anchor="middle" dominant-baseline="middle">X</text>
</svg>`.trim()

await sharp(Buffer.from(icon(32, 7))).png().toFile(OUT_FAV)
await sharp(Buffer.from(icon(180, 36))).png().toFile(OUT_TOUCH)

// ── Minimal manifest (L-01) ────────────────────────────────────────────────
writeFileSync(
  OUT_MANIFEST,
  JSON.stringify(
    {
      name: 'Xangarro!',
      short_name: 'Xangarro',
      description: 'Finanzas para emprendedores — la caja de tu negocio, clara.',
      lang: 'es-MX',
      start_url: '/',
      display: 'browser',
      background_color: '#FFD60A',
      theme_color: '#FFD60A',
      icons: [
        { src: '/assets/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { src: '/assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    null,
    2,
  ) + '\n',
)

const fs = await import('node:fs')
const pngKB  = (fs.statSync(OUT).size     / 1024).toFixed(1)
const webpKB = (fs.statSync(OUT_WEBP).size / 1024).toFixed(1)
console.log(`✓  Generated public/og-image.png  — ${pngKB} KB`)
console.log(`✓  Generated public/og-image.webp — ${webpKB} KB`)
console.log('✓  Generated public/assets/favicon-32.png + apple-touch-icon.png')
console.log('✓  Generated public/site.webmanifest')
