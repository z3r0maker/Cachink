import 'server-only';

import { dominantColor, dominantSvgFill, sanitiseSvg, svgIsSafe } from '@xangarro/domain';
import sharp from 'sharp';

/**
 * One uploaded logo, processed for storage (N-19): the mime and size gates,
 * the SVG sanitiser, and the brand colour extracted from the pixels — the
 * rules live in `@xangarro/domain` (tested there); this module owns the
 * decoding only raster libraries can do.
 */

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const MIMES = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

/** Every refusal here is the owner's to fix: coded, so the action shows it and does not report it. */
export const LOGO_INVALIDO = 'LOGO_INVALIDO';
const refuse = (message: string) => Object.assign(new Error(message), { code: LOGO_INVALIDO });

export interface ProcessedLogo {
  readonly mime: string;
  readonly bytes: Buffer;
  /** Extracted convenience colour; null when the image is all neutrals. */
  readonly brandColor: string | null;
}

export async function processLogo(file: File): Promise<ProcessedLogo> {
  if (file.size === 0) throw refuse('Elige un archivo.');
  if (file.size > MAX_LOGO_BYTES) throw refuse('El logo pesa más de 2 MB.');
  const mime = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!MIMES.has(mime)) throw refuse('El logo debe ser PNG, JPG o SVG.');

  if (mime === 'image/svg+xml') {
    const raw = await file.text();
    const clean = sanitiseSvg(raw);
    if (!svgIsSafe(clean)) throw refuse('Ese SVG trae elementos que no permitimos.');
    return { mime, bytes: Buffer.from(clean, 'utf8'), brandColor: dominantSvgFill(clean) };
  }

  const input = Buffer.from(await file.arrayBuffer());
  // The resize keeps the histogram honest on big exports without losing the
  // brand colour: sharp area-averages, exactly what a dominant colour wants.
  const small = await sharp(input)
    .resize(96, 96, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer()
    // A file that says PNG and is not one: the owner's to replace, and never
    // sharp's own English («Input buffer contains unsupported image format»).
    .catch(() => {
      throw refuse('No pudimos leer esa imagen. Prueba con otro archivo.');
    });
  return { mime, bytes: input, brandColor: dominantColor([...small]) };
}
