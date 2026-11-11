import 'server-only';

import QRCode from 'qrcode';

/**
 * A QR code as an SVG `data:` URI, rendered **on the server**: what it encodes
 * (a pairing link, a TOTP seed) never goes to a third-party QR service or into
 * a client bundle, and the portal's `img-src` already allows `data:`.
 */
export async function qrSvgDataUri(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
