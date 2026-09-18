import { renderSVG } from 'uqr';

/**
 * The otpauth URI as a QR code, rendered **on the server** to an SVG `data:`
 * URI — the seed never goes to a third-party QR service or a client bundle,
 * and the CSP's `img-src 'self' data:` already allows it.
 */
export function qrDataUri(text: string): string {
  const svg = renderSVG(text, { ecc: 'M', border: 2 });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A base32 seed in groups of four, for typing by hand. */
export function groupKey(secret: string): string {
  return (secret.match(/.{1,4}/g) ?? []).join(' ');
}
