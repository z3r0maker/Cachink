import 'server-only';

import {
  exportarTabla,
  tablasDelNegocio,
  type EnTx,
  type TablaDelNegocio,
} from '@xangarro/data-pg';

import { withExportTenant } from '../db';
import { buildExport, DATASETS, type Dataset } from './datasets';
import { enBytes, trozosDe, zipStream, type EntradaZip } from './zip';

/**
 * «Descargar todo»: the whole business in one .zip — the five workbooks the
 * screens export, built by the very same `buildExport`, and `datos.json`,
 * every row the business owns (`datos-negocio.ts` in data-pg). The aviso de
 * privacidad promises it («Exportar (Excel y JSON)») and «Eliminar cuenta»
 * offers it as its first step: data is never held hostage (CLAUDE.md §2.2).
 *
 * Every read goes through `withExportTenant`, one short transaction a batch on
 * the exports' own pool, so RLS scopes it and a long download never holds a
 * connection a device waits for (DB3-SYNC-05).
 */
interface Built {
  readonly filename: string;
  readonly body: ReadableStream<Uint8Array>;
}

/** `Taquería Don Pedro` → `taqueria-don-pedro`: a filename every system can save. */
export function slugDe(nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug === '' ? 'negocio' : slug;
}

/** The day in Mexico City, `YYYY-MM-DD` — the owner's day, not the server's. */
export const fechaMx = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

/**
 * `datos.json`, a piece at a time: `{ exportado, negocio, tablas: { … } }`.
 * Each row arrives as JSON text Postgres wrote, so it is spliced in, never
 * parsed — a centavos string stays the string it was.
 */
export async function* datosJson(
  enTx: EnTx,
  negocio: string,
  tablas: readonly TablaDelNegocio[],
  exportado: Date,
): AsyncGenerator<string> {
  yield `{"exportado":${JSON.stringify(exportado.toISOString())},"negocio":${negocio},"tablas":{`;
  for (const [i, tabla] of tablas.entries()) {
    yield `${i === 0 ? '' : ','}${JSON.stringify(tabla.nombre)}:[`;
    let primera = true;
    for await (const lote of exportarTabla(enTx, tabla)) {
      yield `${primera ? '' : ','}${lote.join(',')}`;
      primera = false;
    }
    yield ']';
  }
  yield '}}';
}

async function* libro(dataset: Dataset, businessId: string, ahora: Date) {
  const { body } = await buildExport(dataset, businessId, { exportedAt: ahora });
  yield* trozosDe(body);
}

/** The `businesses` row, read first: its name names the file, and a dead database fails here, with a status. */
async function leerNegocio(enTx: EnTx, tablas: readonly TablaDelNegocio[]) {
  const tabla = tablas.find((t) => t.nombre === 'businesses');
  if (tabla === undefined) throw new Error('El negocio no se puede leer.');
  for await (const [fila] of exportarTabla(enTx, tabla, 1)) {
    if (fila !== undefined)
      return { fila, nombre: String((JSON.parse(fila) as { nombre?: unknown }).nombre ?? '') };
  }
  throw new Error('El negocio no existe.');
}

export async function buildTodo(businessId: string, ahora: Date = new Date()): Promise<Built> {
  const enTx: EnTx = (fn) => withExportTenant(businessId, fn);
  const tablas = await enTx(tablasDelNegocio);
  const negocio = await leerNegocio(enTx, tablas);
  const resto = tablas.filter((t) => t.nombre !== 'businesses');
  const entradas: EntradaZip[] = [
    ...DATASETS.map((d) => ({
      nombre: `${d}.xlsx`,
      guardada: true,
      contenido: () => libro(d, businessId, ahora),
    })),
    { nombre: 'datos.json', contenido: () => enBytes(datosJson(enTx, negocio.fila, resto, ahora)) },
  ];
  return {
    filename: `xangarro-${slugDe(negocio.nombre)}-${fechaMx(ahora)}.zip`,
    body: zipStream(entradas, ahora),
  };
}
