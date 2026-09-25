/**
 * The social card as SVG: brand-yellow neobrutalist card, hard shadow, black
 * footer bar, in the landing's own visual language. `lines` is the headline
 * already broken into lines (see wrapTitle); `sub` is the smaller line under it.
 */
const W = 1200;
const H = 630;
const BORDER = 12;
const SHADOW = 16;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Breaks a title into at most `max` lines of roughly `chars` characters, on word boundaries. */
export function wrapTitle(title, chars = 24, max = 3) {
  const lines = [];
  let line = '';
  for (const word of title.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > chars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > max) lines.splice(max - 1, lines.length, `${lines.slice(max - 1).join(' ')}`);
  return lines;
}

export function ogCardSvg({ eyebrow, lines, sub, footer }) {
  const size = lines.length > 2 ? 68 : lines.length > 1 ? 80 : 96;
  const lineH = size * 1.08;
  // The first baseline sits under the coin mark; extra lines extend downward, never up into it.
  const top = lines.length > 1 ? 250 : 270;
  const headline = lines
    .map(
      (l, i) =>
        `<text x="68" y="${top + i * lineH}" font-size="${size}" font-weight="900" fill="#0D0D0D" letter-spacing="-2">${esc(l)}</text>`,
    )
    .join('\n  ');
  const subY = top + (lines.length - 1) * lineH + 64;
  return `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
     style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect x="${BORDER + SHADOW}" y="${BORDER + SHADOW}" width="${W - BORDER * 2 - SHADOW}" height="${H - BORDER * 2 - SHADOW}" fill="#0D0D0D" rx="24" />
  <rect x="${BORDER}" y="${BORDER}" width="${W - BORDER * 2 - SHADOW}" height="${H - BORDER * 2 - SHADOW}" fill="#FFD60A" stroke="#0D0D0D" stroke-width="${BORDER}" rx="24" />
  <rect x="${BORDER}" y="${H - BORDER - SHADOW - 100}" width="${W - BORDER * 2 - SHADOW}" height="50" fill="#0D0D0D" />
  <rect x="${BORDER}" y="${H - BORDER - SHADOW - 50}" width="${W - BORDER * 2 - SHADOW}" height="50" fill="#0D0D0D" rx="24" />
  <text x="68" y="100" font-size="18" font-weight="800" fill="#0D0D0D" style="text-transform:uppercase; letter-spacing: 0.2em;">${esc(eyebrow)}</text>
  <circle cx="68" cy="155" r="42" fill="#0D0D0D" />
  <circle cx="68" cy="155" r="34" fill="#FFD60A" />
  <text x="68" y="165" font-size="28" font-weight="900" fill="#0D0D0D" text-anchor="middle" dominant-baseline="middle">$</text>
  ${headline}
  <text x="68" y="${subY}" font-size="28" font-weight="600" fill="#1A1A18" letter-spacing="-0.5">${esc(sub)}</text>
  <text x="68" y="${H - BORDER - SHADOW - 38}" font-size="20" font-weight="700" fill="#FFD60A" letter-spacing="1">${esc(footer)}</text>
  <circle cx="980" cy="290" r="180" fill="#0D0D0D" opacity="0.08" />
  <circle cx="980" cy="290" r="155" fill="#0D0D0D" opacity="0.06" />
  <text x="980" y="340" font-size="160" font-weight="900" fill="#0D0D0D" opacity="0.18" text-anchor="middle" dominant-baseline="middle">$</text>
</svg>`.trim();
}
