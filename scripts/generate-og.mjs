/**
 * Generates public/og-image.png (1200×630) — the Open Graph / Twitter Card
 * social preview image for Cachink.
 *
 * Design: neobrutalist yellow card — brand yellow background, hard black
 * border, "Cachink" wordmark, hero headline, and a black footer bar.
 * Matches the landing page's visual language exactly.
 *
 * Run:  node scripts/generate-og.mjs
 */

import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/og-image.png')

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

  <!-- Top-left: ¡CACHINK! eyebrow label -->
  <text
    x="68" y="100"
    font-size="18" font-weight="800" fill="#0D0D0D"
    letter-spacing="4" text-transform="uppercase"
    style="text-transform:uppercase; letter-spacing: 0.2em;"
  >¡CACHINK! · FINANZAS CLARAS</text>

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
  >cachink.mx · Disponible en iOS y Android</text>

  <!-- Right-side accent: large $ coin -->
  <circle cx="980" cy="290" r="180" fill="#0D0D0D" opacity="0.08" />
  <circle cx="980" cy="290" r="155" fill="#0D0D0D" opacity="0.06" />
  <text x="980" y="340"
        font-size="160" font-weight="900" fill="#0D0D0D" opacity="0.18"
        text-anchor="middle" dominant-baseline="middle">$</text>

</svg>
`.trim()

const svgBuffer = Buffer.from(svg)

await sharp(svgBuffer)
  .png({ compressionLevel: 9, palette: false })
  .toFile(OUT)

const { size } = (await import('node:fs')).statSync(OUT)
console.log(`✓  Generated public/og-image.png — ${(size / 1024).toFixed(1)} KB`)
