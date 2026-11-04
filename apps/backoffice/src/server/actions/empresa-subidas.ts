'use server';

import { assertArchivo, MAX_BYTES_DIRECTO } from '@xangarro/domain/corp';

import { azureBlobs } from '../blobs';
import { requireFounder } from '../founder';

/**
 * A browser asks where to send a file before it submits a «Empresa» form
 * (E-26). Without Azure the answer is null and the file travels in the form,
 * as before; with it, a one-time URL into the inbox, signed only after the
 * founder gate and after the name, type and size pass the domain's check.
 */
export type Firma =
  | { readonly key: string; readonly url: string }
  | { readonly error: string }
  | null;

export async function firmarSubidaAction(archivo: {
  readonly nombre: string;
  readonly mime: string;
  readonly tamano: number;
}): Promise<Firma> {
  await requireFounder();
  const azure = azureBlobs();
  if (azure === null) return null;
  try {
    assertArchivo(archivo.nombre, archivo.mime, archivo.tamano, MAX_BYTES_DIRECTO);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Ese archivo no se puede subir.' };
  }
  return azure.firmarSubida();
}
