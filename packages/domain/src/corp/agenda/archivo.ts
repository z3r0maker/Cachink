import { ArchivoInvalidoError } from './errors.js';

/**
 * What the Expediente accepts as evidence (E-04, E-05): the SAT's PDFs and
 * XMLs and a screenshot of a review. Up to 4 MB when the file travels in a
 * request to the console (which carries at most 4.5 MB); up to 25 MB when the
 * browser sends it straight to Azure Blob (E-26). Kept five years from
 * upload, CFF art. 30.
 */
export const MIMES_EVIDENCIA = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/xml',
  'text/xml',
] as const;

export const MAX_BYTES_EVIDENCIA = 4 * 1024 * 1024;

/** The limit for a file the browser uploads straight to the blob store (E-26). */
export const MAX_BYTES_DIRECTO = 25 * 1024 * 1024;

export const ANIOS_RETENCION = 5;

export function assertArchivo(
  nombre: string,
  mime: string,
  tamano: number,
  maximo: number = MAX_BYTES_EVIDENCIA,
): void {
  if (nombre.trim() === '' || tamano === 0)
    throw new ArchivoInvalidoError('El archivo está vacío.');
  if (!(MIMES_EVIDENCIA as readonly string[]).includes(mime)) {
    throw new ArchivoInvalidoError('Sube un PDF, una imagen (PNG o JPG) o el XML del SAT.');
  }
  if (tamano > maximo) {
    throw new ArchivoInvalidoError(`El archivo pasa de ${maximo / (1024 * 1024)} MB.`);
  }
}

/** The last day a document must be kept: five years after it was uploaded. */
export function retenerHasta(hoy: string): string {
  const year = Number(hoy.slice(0, 4)) + ANIOS_RETENCION;
  // 29 Feb + 5 years is not a date; keep it to the 28th.
  return hoy.slice(5) === '02-29' ? `${year}-02-28` : `${year}${hoy.slice(4)}`;
}
