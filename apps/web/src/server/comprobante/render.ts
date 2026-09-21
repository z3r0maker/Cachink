import 'server-only';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sharp, { type SharpOptions } from 'sharp';

/**
 * SVG → PNG for the comprobantes (N-20). The two receipt families are
 * vendored (OFL) under assets/comprobante-fonts; how they resolve differs
 * by platform — Linux rasterizes through fontconfig, where sharp's `fonts`
 * option + a generated conf with absolute paths is the documented route;
 * darwin rasterizes through CoreText, which only sees installed fonts
 * (scripts/fuentes-comprobantes.sh installs them on a dev machine).
 */

let dirConf: string | null = null;

function confFuentes(): string {
  if (dirConf !== null) return dirConf;
  const dirFuentes = path.join(process.cwd(), 'assets', 'comprobante-fonts', 'fonts');
  dirConf = fs.mkdtempSync(path.join(os.tmpdir(), 'xg-fuentes-'));
  fs.writeFileSync(
    path.join(dirConf, 'fonts.conf'),
    '<?xml version="1.0"?>\n' +
      '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n' +
      '<fontconfig>\n' +
      `  <dir>${dirFuentes}</dir>\n` +
      `  <cachedir>${dirConf}</cachedir>\n` +
      '</fontconfig>\n',
  );
  return dirConf;
}

/** WhatsApp target width (1080, per the fichas) and the print raster's. */
export const ANCHO_WHATSAPP = 1080;
export const ANCHO_IMPRESION = 1500;

export async function comprobantePng(svg: string, ancho: number): Promise<Buffer> {
  // `fonts` ships in sharp's runtime since 0.32 but not yet in 0.35's
  // SharpOptions typings — the cast is only the declaration gap.
  const opciones = { density: 216, fonts: [confFuentes()] } as SharpOptions;
  return sharp(Buffer.from(svg), opciones).resize({ width: ancho }).png().toBuffer();
}

/** Height/width of a raster — the PDF page's aspect. */
export async function aspectoDe(png: Buffer): Promise<number> {
  const meta = await sharp(png).metadata();
  if (meta.width === undefined || meta.height === undefined || meta.width === 0) {
    throw new Error('el PNG del comprobante no tiene dimensiones');
  }
  return meta.height / meta.width;
}
