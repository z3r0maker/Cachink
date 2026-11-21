/**
 * The phone's copy of the business logo on its file system (N-19), and the
 * conditional GET that refreshes it: the two ports of
 * `RefrescarLogoNegocioUseCase` over the shape of `expo-file-system/legacy`.
 *
 * Layout, under the persistent document directory (not the purgeable cache):
 *
 *   logo-negocio/actual.json   which copy is current: url, etag, revision, mime, file
 *   logo-negocio/<etag>.logo   the bytes, one file per ETag
 *
 * The file is keyed by the ETag (the bytes' hash), so re-checking a logo that
 * did not change rewrites only `actual.json`; a new logo writes its file and
 * removes the others. `.shared` suffix: a bare `./logo-almacen` import
 * resolves to the platform adapter.
 */
import type { LogoCache, LogoDescarga, LogoGuardado, RespuestaLogo } from '@xangarro/application';

/** The slice of `expo-file-system/legacy` this needs. */
export interface LogoFs {
  readonly documentDirectory: string | null;
  readonly cacheDirectory: string | null;
  getInfoAsync(uri: string): Promise<{ readonly exists: boolean }>;
  readAsStringAsync(uri: string, o?: { encoding?: 'utf8' | 'base64' }): Promise<string>;
  writeAsStringAsync(uri: string, s: string, o?: { encoding?: 'utf8' | 'base64' }): Promise<void>;
  deleteAsync(uri: string, o?: { idempotent?: boolean }): Promise<void>;
  makeDirectoryAsync(uri: string, o?: { intermediates?: boolean }): Promise<void>;
  readDirectoryAsync(uri: string): Promise<string[]>;
  downloadAsync(
    url: string,
    fileUri: string,
    o?: { headers?: Record<string, string>; md5?: boolean },
  ): Promise<{
    readonly status: number;
    readonly headers: Record<string, string>;
    readonly md5?: string;
    readonly mimeType: string | null;
  }>;
}

/** The logo URL answered something other than 200 or 304. */
export class LogoDescargaError extends Error {
  readonly code = 'LOGO_DESCARGA';
  constructor(readonly status: number) {
    super(`The logo URL answered ${status}.`);
  }
}

const ACTUAL = 'actual.json';

interface Actual extends Omit<LogoGuardado, 'base64'> {
  readonly archivo: string;
}

/** An ETag as a file name: quotes, `W/` and anything else unsafe dropped. */
export const archivoDe = (etag: string): string =>
  `${etag.replace(/^W\//, '').replace(/[^A-Za-z0-9_-]/g, '')}.logo`;

/** A response header, whatever case the platform reports it in. */
function cabecera(headers: Record<string, string>, nombre: string): string | null {
  const clave = Object.keys(headers).find((k) => k.toLowerCase() === nombre);
  return clave === undefined ? null : (headers[clave] ?? null);
}

async function leerActual(fs: LogoFs, dir: string): Promise<LogoGuardado | null> {
  try {
    if (!(await fs.getInfoAsync(`${dir}${ACTUAL}`)).exists) return null;
    const { archivo, ...meta } = JSON.parse(
      await fs.readAsStringAsync(`${dir}${ACTUAL}`),
    ) as Actual;
    const base64 = await fs.readAsStringAsync(`${dir}${archivo}`, { encoding: 'base64' });
    return { ...meta, base64 };
  } catch {
    // A torn or missing copy is no copy: the next refresh downloads it again.
    return null;
  }
}

async function guardarActual(fs: LogoFs, dir: string, logo: LogoGuardado): Promise<void> {
  const { base64, ...meta } = logo;
  const archivo = archivoDe(logo.etag);
  await fs.makeDirectoryAsync(dir, { intermediates: true });
  if (!(await fs.getInfoAsync(`${dir}${archivo}`)).exists) {
    await fs.writeAsStringAsync(`${dir}${archivo}`, base64, { encoding: 'base64' });
  }
  const actual: Actual = { ...meta, archivo };
  await fs.writeAsStringAsync(`${dir}${ACTUAL}`, JSON.stringify(actual));
  for (const otro of await fs.readDirectoryAsync(dir)) {
    if (otro !== ACTUAL && otro !== archivo)
      await fs.deleteAsync(`${dir}${otro}`, { idempotent: true });
  }
}

async function descargar(
  fs: LogoFs,
  url: string,
  etagPrevio: string | null,
): Promise<RespuestaLogo> {
  const tmp = `${fs.cacheDirectory ?? fs.documentDirectory ?? ''}logo-negocio-descarga`;
  try {
    const r = await fs.downloadAsync(url, tmp, {
      headers: etagPrevio === null ? {} : { 'If-None-Match': etagPrevio },
      md5: true,
    });
    if (r.status === 304) return { cambio: false };
    if (r.status !== 200) throw new LogoDescargaError(r.status);
    const base64 = await fs.readAsStringAsync(tmp, { encoding: 'base64' });
    const tipo = cabecera(r.headers, 'content-type') ?? r.mimeType ?? '';
    return {
      cambio: true,
      etag: cabecera(r.headers, 'etag') ?? `"md5-${r.md5 ?? ''}"`,
      mime: (tipo.split(';')[0] ?? '').trim().toLowerCase(),
      base64,
    };
  } finally {
    await fs.deleteAsync(tmp, { idempotent: true });
  }
}

/** Both ports over `fs`; null when the platform has no document directory. */
export function logoAlmacenDe(fs: LogoFs): (LogoCache & LogoDescarga) | null {
  if (fs.documentDirectory === null) return null;
  const dir = `${fs.documentDirectory}logo-negocio/`;
  return {
    leer: () => leerActual(fs, dir),
    guardar: (logo) => guardarActual(fs, dir, logo),
    borrar: () => fs.deleteAsync(dir, { idempotent: true }),
    descargar: (url, etagPrevio) => descargar(fs, url, etagPrevio),
  };
}
