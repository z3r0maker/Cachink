/**
 * Generates public/og-image.png (1200×630) — the Open Graph / Twitter Card
 * social preview image for Xangarro. The favicons, touch icon and
 * site.webmanifest are copied from `assets/brand/icons/` (X-07), not generated.
 *
 * Design: neobrutalist yellow card — brand yellow background, hard black
 * border, "XANGARRO!" wordmark, hero headline, and a black footer bar. The
 * coin (small mark + large watermark) is `assets/brand/icons/mark-flat.svg`.
 * Matches the landing page's visual language exactly.
 *
 * Run:  node scripts/generate-og.mjs
 */

import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT     = resolve(__dirname, '../public/og-image.png')
const OUT_WEBP = resolve(__dirname, '../public/og-image.webp')
// The flat coin mark (X-07) — read from the brand master, never redrawn here.
const MARK = resolve(__dirname, '../../../assets/brand/icons/mark-flat.svg')

const W = 1200
const H = 630
const BORDER = 12        // outer border width
const SHADOW = 16        // hard offset shadow

// mark-flat.svg is a 1024 viewBox whose disc has r=395 around (512, 512).
const MARK_VIEWBOX = 1024
const MARK_DISC_R = 395
const markSvg = readFileSync(MARK, 'utf8').trim()
if (!markSvg.includes(`r="${MARK_DISC_R}"`)) {
  throw new Error(`mark-flat.svg changed shape — update MARK_DISC_R in ${fileURLToPath(import.meta.url)}`)
}

/** The brand mark as a nested <svg>, its disc of radius `r` centred on (cx, cy). */
const mark = (cx, cy, r) => {
  const size = (MARK_VIEWBOX * r) / MARK_DISC_R
  return markSvg.replace(
    /^<svg[^>]*>/,
    `<svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}">`,
  )
}

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

  <!-- Coin logo mark: the brand mark inside the card's black ring -->
  <circle cx="68" cy="155" r="42" fill="#0D0D0D" />
  ${mark(68, 155, 34)}

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

  <!-- Right-side accent: large faded coin — the mark as a watermark -->
  <circle cx="980" cy="290" r="180" fill="#0D0D0D" opacity="0.08" />
  <circle cx="980" cy="290" r="155" fill="#0D0D0D" opacity="0.06" />
  <g opacity="0.18">${mark(980, 290, 155)}</g>

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

const fs = await import('node:fs')
const pngKB  = (fs.statSync(OUT).size     / 1024).toFixed(1)
const webpKB = (fs.statSync(OUT_WEBP).size / 1024).toFixed(1)
console.log(`✓  Generated public/og-image.png  — ${pngKB} KB`)
console.log(`✓  Generated public/og-image.webp — ${webpKB} KB`)
