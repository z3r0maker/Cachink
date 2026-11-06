import 'server-only';

import { Zip, ZipDeflate, ZipPassThrough } from 'fflate';

/**
 * A .zip written as its entries are read, for «Descargar todo».
 *
 * Pulled, not pushed: the response asks for the next piece of the file and
 * only then is the next batch of rows read and compressed, so a slow
 * connection slows the reads instead of growing the heap — the same promise
 * `stream.ts` makes for one workbook (DB3-EXP-01, ADR-122), kept across six
 * files. Memory holds about one batch, whatever the business's history.
 */
export interface EntradaZip {
  readonly nombre: string;
  /**
   * Already compressed — an .xlsx is a zip of its own — so it is stored as is:
   * deflating it again costs time and saves nothing.
   */
  readonly guardada?: boolean;
  /** Called when the entry's turn comes, so nothing is read before it is written. */
  readonly contenido: () => AsyncIterable<Uint8Array>;
}

const archivoDe = (e: EntradaZip, mtime: Date) => {
  const f =
    e.guardada === true ? new ZipPassThrough(e.nombre) : new ZipDeflate(e.nombre, { level: 6 });
  f.mtime = mtime;
  return f;
};

async function* comprimir(
  entradas: readonly EntradaZip[],
  mtime: Date,
): AsyncGenerator<Uint8Array> {
  const salida: Uint8Array[] = [];
  let fallo: Error | null = null;
  const zip = new Zip((err, trozo) => {
    if (err !== null) fallo = err;
    else salida.push(trozo);
  });
  // fflate compresses synchronously inside `push`; what it wrote is in `salida`.
  const listo = (): Uint8Array[] => {
    if (fallo !== null) throw fallo as Error;
    return salida.splice(0);
  };
  for (const e of entradas) {
    const archivo = archivoDe(e, mtime);
    zip.add(archivo);
    for await (const trozo of e.contenido()) {
      archivo.push(trozo);
      yield* listo();
    }
    archivo.push(new Uint8Array(0), true);
    yield* listo();
  }
  zip.end();
  yield* listo();
}

/**
 * The zip as a web stream, for a `Response` body. A failure mid-way errors the
 * stream, which the browser reports as a failed download rather than saving a
 * truncated file; a download that goes away stops the reads.
 */
export function zipStream(
  entradas: readonly EntradaZip[],
  mtime: Date = new Date(),
): ReadableStream<Uint8Array> {
  const it = comprimir(entradas, mtime);
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const r = await it.next();
      if (r.done === true) controller.close();
      else controller.enqueue(r.value);
    },
    async cancel() {
      await it.return(undefined);
    },
  });
}

/** A web stream's chunks, as an async iterable (the DOM lib does not type it as one). */
export async function* trozosDe(body: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

const TROZO = 64 * 1024;

/** Text pieces as bytes, gathered into chunks of about 64 KB so deflate works on more than a row at a time. */
export async function* enBytes(textos: AsyncIterable<string>): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  let pendiente = '';
  for await (const t of textos) {
    pendiente += t;
    if (pendiente.length >= TROZO) {
      yield encoder.encode(pendiente);
      pendiente = '';
    }
  }
  if (pendiente.length > 0) yield encoder.encode(pendiente);
}
