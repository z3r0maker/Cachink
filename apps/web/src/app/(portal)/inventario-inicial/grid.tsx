'use client';

import { parseCsv } from '@/lib/csv';

/** One grid row while the owner edits it. */
export interface Fila {
  readonly productoId: string;
  readonly nombre: string;
  readonly sku: string;
  readonly unidad: string;
  readonly icono: string | null;
  readonly cantidad: string;
  readonly costo: string;
}

/**
 * The CSV prefill (N-17): cantidad + costo per catalogue product, from a .csv
 * of producto, cantidad, costo. Rows without match are reported, never
 * invented.
 */
export async function prellenarCsv(
  file: File,
  filas: readonly Fila[],
  porNombre: ReadonlyMap<string, string>,
): Promise<{ filas: Fila[]; sinMatch: string[]; prellenados: number }> {
  const tabla = parseCsv(await file.text());
  const [head = [], ...body] = tabla;
  const idx = (h: string) => head.findIndex((x) => String(x).trim().toLowerCase() === h);
  const set = new Map(filas.map((f) => [f.productoId, f]));
  const sinMatch: string[] = [];
  let prellenados = 0;
  body.forEach((row) => {
    const nombre = String(row[idx('producto') ?? 0] ?? '').trim();
    const id = porNombre.get(nombre.toLowerCase());
    const actual = id === undefined ? undefined : set.get(id);
    if (id === undefined || actual === undefined) {
      if (nombre !== '') sinMatch.push(nombre);
      return;
    }
    prellenados += 1;
    set.set(id, filaDesdeCsv(actual, row, idx));
  });
  return { filas: [...set.values()], sinMatch, prellenados };
}

function filaDesdeCsv(actual: Fila, row: readonly unknown[], idx: (h: string) => number): Fila {
  const costo = String(row[idx('costo') ?? 2] ?? '').trim();
  return {
    ...actual,
    cantidad: String(row[idx('cantidad') ?? 1] ?? '').trim(),
    costo: costo === '' ? actual.costo : costo,
  };
}

/** The banner a prefill leaves: what matched, what did not, from which file. */
export function avisoPrellenado(
  archivo: string,
  r: { sinMatch: readonly string[]; prellenados: number },
): { tono: 'success' | 'warning'; texto: string } {
  const base = `Prellené ${r.prellenados} ${r.prellenados === 1 ? 'producto' : 'productos'} desde ${archivo}.`;
  if (r.sinMatch.length === 0)
    return { tono: 'success', texto: `${base} Revisa antes de guardar.` };
  const lista = r.sinMatch.slice(0, 3).join(', ');
  const mas = r.sinMatch.length > 3 ? ` y ${r.sinMatch.length - 3} más` : '';
  return {
    tono: 'warning',
    texto: `${base} Sin match en tu catálogo: ${lista}${mas}. Revisa antes de guardar.`,
  };
}
