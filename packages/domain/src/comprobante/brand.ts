/**
 * Brand helpers for N-19: sanitising an uploaded SVG and pulling the brand
 * colour out of a decoded logo. Pure string/pixel work, no I/O — the server
 * decodes the raster (sharp) and hands pixels here, where every rule is
 * tested.
 */

/** Everything an SVG must not carry into our origin (N-19 acceptance). */
export function sanitiseSvg(source: string): string {
  let svg = source
    // Entity tricks that could smuggle markup past the tag filters below.
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '');

  // Drop the dangerous elements outright, with whatever they contain.
  svg = svg.replace(
    /<\s*(script|foreignObject|iframe|embed|object|animate|set|handler|use)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
    '',
  );
  svg = svg.replace(
    /<\s*(script|foreignObject|iframe|embed|object|animate|set|handler|use)\b[^>]*\/?>/gi,
    '',
  );

  // Event handlers and javascript/data URLs, on any element that survives.
  svg = svg.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  svg = svg.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  svg = svg.replace(/(?:xlink:href|href)\s*=\s*"(?:javascript|data):[^"]*"/gi, '');
  svg = svg.replace(/(?:xlink:href|href)\s*=\s*'(?:javascript|data):[^']*'/gi, '');
  svg = svg.replace(/\bstyle\s*=\s*"[^"]*(?:javascript:|expression\()[^"]*"/gi, '');

  return svg.trim();
}

/** True when nothing dangerous survived — the upload's final gate. */
export function svgIsSafe(svg: string): boolean {
  const lower = svg.toLowerCase();
  return !(
    lower.includes('<script') ||
    lower.includes('foreignobject') ||
    /\son[a-z]+\s*=/.test(lower) ||
    lower.includes('javascript:') ||
    lower.includes('<iframe') ||
    lower.includes('<embed') ||
    lower.includes('<object')
  );
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const clamp = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`.toLowerCase();
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function isNeutral({ r, g, b }: Rgb): boolean {
  return Math.max(r, g, b) - Math.min(r, g, b) < 24;
}

/**
 * The dominant non-neutral colour of decoded RGBA pixels, saturation-weighted
 * so a logo's brand red beats its grey surroundings. Null when the image is
 * all neutrals (black/white/grey line art): the picker then starts empty.
 */
export function dominantColor(rgba: ReadonlyArray<number>): string | null {
  const bins = new Map<string, { weight: number; n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const a = rgba[i + 3] as number;
    if (a < 128) continue;
    const px: Rgb = { r: rgba[i] as number, g: rgba[i + 1] as number, b: rgba[i + 2] as number };
    if (isNeutral(px)) continue;
    const key = `${px.r >> 4}${px.g >> 4}${px.b >> 4}`;
    const bin = bins.get(key) ?? { weight: 0, n: 0, r: 0, g: 0, b: 0 };
    bin.weight += 1 + saturation(px) * 3;
    bin.n += 1;
    bin.r += px.r;
    bin.g += px.g;
    bin.b += px.b;
    bins.set(key, bin);
  }
  let best: { weight: number; n: number; r: number; g: number; b: number } | null = null;
  for (const bin of bins.values()) {
    if (best === null || bin.weight > best.weight) best = bin;
  }
  if (best === null) return null;
  const n = Math.max(1, best.n);
  return toHex({ r: best.r / n, g: best.g / n, b: best.b / n });
}

/**
 * The dominant `fill` of an SVG's shapes — the colour the merchant drew with,
 * not the black of its text. Null when the file draws only neutrals.
 */
export function dominantSvgFill(svg: string): string | null {
  const counts = new Map<string, number>();
  const re = /(?:fill|stroke)\s*=\s*"(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))"/g;
  for (const m of svg.matchAll(re)) {
    let hex = (m[1] as string).toLowerCase();
    if (hex.length === 4) {
      // #abc → #aabbcc, so the channels below parse.
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNeutral({ r, g, b })) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [hex, n] of counts) {
    if (n > bestN) {
      best = hex;
      bestN = n;
    }
  }
  return best;
}
