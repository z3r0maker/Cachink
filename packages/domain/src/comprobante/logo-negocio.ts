/**
 * What a business logo may be (N-19): the portal's upload refuses anything
 * else, and the phone refuses to cache anything else it is handed back.
 */

import { base64ByteLength } from '../entities/product-image.js';

/** Decoded bytes a logo may weigh. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** The kinds the upload stores: PNG, JPG and (sanitised) SVG. */
export const LOGO_MIMES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
]);

/** True when `mime` and the base64 `bytes` are a logo the upload would have stored. */
export function esLogoAdmitido(mime: string, bytes: string): boolean {
  const peso = base64ByteLength(bytes);
  return LOGO_MIMES.has(mime) && peso > 0 && peso <= MAX_LOGO_BYTES;
}
