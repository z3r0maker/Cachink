import 'server-only';

import type { Archivo } from '@xangarro/application/corp';
import { ArchivoInvalidoError } from '@xangarro/domain/corp';

import { azureBlobs } from '../blobs';

/**
 * The file a «Empresa» form carries (E-26), however it travelled:
 *
 * - `archivoSubido`: the browser already sent it to the Azure inbox; the form
 *   carries its key, name and type, and the bytes are fetched from there.
 * - `archivo`: the file itself, in the request (no Azure, or a small file).
 * - `archivoError`: the browser could not send it; the reason is shown.
 *
 * Null when the form has no file at all.
 */
const MAX_MENSAJE = 200;

interface Subido {
  readonly key: string;
  readonly nombre: string;
  readonly mime: string;
}

function parseSubido(raw: string): Subido | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return null;
    const { key, nombre, mime } = v as Record<string, unknown>;
    return typeof key === 'string' && typeof nombre === 'string' && typeof mime === 'string'
      ? { key, nombre, mime }
      : null;
  } catch {
    return null;
  }
}

async function desdeLaBandeja(raw: string): Promise<Archivo> {
  const subido = parseSubido(raw);
  const azure = azureBlobs();
  const contenido = subido === null || azure === null ? null : await azure.leerSubida(subido.key);
  if (subido === null || contenido === null) {
    throw new ArchivoInvalidoError('No llegó el archivo. Súbelo de nuevo.');
  }
  return { nombre: subido.nombre, mime: subido.mime, contenido };
}

export async function archivoDelForm(form: FormData): Promise<Archivo | null> {
  const error = form.get('archivoError');
  if (typeof error === 'string' && error !== '') {
    throw new ArchivoInvalidoError(error.slice(0, MAX_MENSAJE));
  }
  const subido = form.get('archivoSubido');
  if (typeof subido === 'string' && subido !== '') return desdeLaBandeja(subido);
  const f = form.get('archivo');
  if (!(f instanceof File) || f.size === 0) return null;
  return { nombre: f.name, mime: f.type, contenido: new Uint8Array(await f.arrayBuffer()) };
}
