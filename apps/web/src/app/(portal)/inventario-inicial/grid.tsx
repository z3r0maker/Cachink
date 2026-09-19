'use client';

import { parseCsv } from '@/lib/csv';

import { TablaFilas } from './tabla';

/** One grid row while the owner edits it. */
export interface Fila {
  readonly productoId: string;
  readonly nombre: string;
  readonly cantidad: string;
  readonly costo: string;
}

/**
 * The editable grid (N-17): cantidad + costo per catalogue product, prefillable
 * from a .csv of producto, cantidad, costo. Rows without match are reported,
 * never invented.
 */
async function prellenarCsv(
  file: File,
  filas: readonly Fila[],
  porNombre: ReadonlyMap<string, string>,
): Promise<{ filas: Fila[]; sinMatch: string[] }> {
  const tabla = parseCsv(await file.text());
  const [head = [], ...body] = tabla;
  const idx = (h: string) => head.findIndex((x) => String(x).trim().toLowerCase() === h);
  const set = new Map(filas.map((f) => [f.productoId, f]));
  const sinMatch: string[] = [];
  body.forEach((row) => {
    const nombre = String(row[idx('producto') ?? 0] ?? '').trim();
    const id = porNombre.get(nombre.toLowerCase());
    if (id === undefined) {
      if (nombre !== '') sinMatch.push(nombre);
      return;
    }
    set.set(id, filaDesdeCsv(set.get(id), id, row, idx));
  });
  return { filas: [...set.values()], sinMatch };
}

function filaDesdeCsv(
  actual: Fila | undefined,
  id: string,
  row: readonly unknown[],
  idx: (h: string) => number,
): Fila {
  const costo = String(row[idx('costo') ?? 2] ?? '').trim();
  return {
    productoId: id,
    nombre: actual?.nombre ?? '',
    cantidad: String(row[idx('cantidad') ?? 1] ?? '').trim(),
    costo: costo === '' ? (actual?.costo ?? '0') : costo,
  };
}

export function GridInventario({
  filas,
  setFilas,
  editable,
  porNombre,
  onBanner,
}: {
  readonly filas: readonly Fila[];
  readonly setFilas: (fn: (fs: Fila[]) => Fila[]) => void;
  readonly editable: boolean;
  readonly porNombre: ReadonlyMap<string, string>;
  readonly onBanner: (tone: 'success' | 'critical', text: string) => void;
}) {
  const alPrelLenar = async (file: File | null) => {
    if (file === null) return;
    const r = await prellenarCsv(file, filas, porNombre);
    setFilas(() => r.filas);
    onBanner(
      r.sinMatch.length > 0 ? 'critical' : 'success',
      r.sinMatch.length > 0
        ? `Sin match en tu catálogo: ${r.sinMatch.slice(0, 3).join(', ')}…`
        : 'Grid prellenado; revisa antes de capturar.',
    );
  };

  return (
    <>
      <BarraPrelLenado editable={editable} onPrelLenar={alPrelLenar} />
      <TablaFilas filas={filas} editable={editable} setFilas={setFilas} />
    </>
  );
}

function BarraPrelLenado({
  editable,
  onPrelLenar,
}: {
  readonly editable: boolean;
  readonly onPrelLenar: (f: File | null) => void;
}) {
  return (
    <div
      style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '16px 0', flexWrap: 'wrap' }}
    >
      {editable ? (
        <label
          style={{
            display: 'inline-flex',
            gap: 8,
            alignItems: 'center',
            border: '2px solid var(--black)',
            borderRadius: 10,
            padding: '8px 14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Prellenar desde .csv
          <input
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => onPrelLenar(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : null}
      <span style={{ color: 'var(--gray-600)', fontSize: 13 }}>
        columnas: producto, cantidad, costo
      </span>
    </div>
  );
}
