'use client';

import { portalFontSizes } from '@xangarro/tokens';

import { parseClientSheet } from '@/lib/import-clientes';

import { TablaLineas } from './tabla-lineas';

/** One CxC line while the owner edits it. */
export interface Linea {
  readonly clienteId: string;
  readonly nombre: string;
  readonly saldo: string;
}

/**
 * The CxC lines (N-17): hand-edited, or prefilled from a .csv shaped like the
 * Clientes import plus a saldo column (nombre, teléfono, saldo). A row whose
 * cliente does not exist is reported, never silently created.
 */

/** Prefill from the Clientes-import shape + saldo column; never invents clientes. */
async function prellenarLineas(
  file: File,
  porNombre: ReadonlyMap<string, { id: string; nombre: string }>,
): Promise<{ lineas: Linea[]; sinMatch: string[] }> {
  const { parseCsv } = await import('@/lib/csv');
  const tabla = parseCsv(await file.text());
  const parsed = parseClientSheet(tabla);
  if (!parsed.ok) throw new Error(parsed.message);
  const nuevas: Linea[] = [];
  const sinMatch: string[] = [];
  for (const row of parsed.rows) {
    if (row.values === null) continue;
    const v = row.values as { nombre: string };
    const match = porNombre.get(v.nombre.trim().toLowerCase());
    if (match === undefined) {
      sinMatch.push(v.nombre);
      continue;
    }
    const celda = tabla[row.line - 1] as readonly unknown[] | undefined;
    nuevas.push({
      clienteId: match.id,
      nombre: match.nombre,
      saldo: String(celda?.[2] ?? '').trim(),
    });
  }
  return { lineas: nuevas, sinMatch };
}

export function LineasCxC({
  lineas,
  setLineas,
  editable,
  porNombre,
  onBanner,
}: {
  readonly lineas: readonly Linea[];
  readonly setLineas: (fn: (ls: Linea[]) => Linea[]) => void;
  readonly editable: boolean;
  readonly porNombre: ReadonlyMap<string, { id: string; nombre: string }>;
  readonly onBanner: (tone: 'success' | 'critical', text: string) => void;
}) {
  const prellenar = async (file: File | null) => {
    if (file === null) return;
    try {
      const r = await prellenarLineas(file, porNombre);
      setLineas(() => r.lineas);
      if (r.sinMatch.length > 0) {
        onBanner(
          'critical',
          `${r.sinMatch.length} sin match (impórtalos primero en Clientes): ${r.sinMatch.slice(0, 3).join(', ')}…`,
        );
      } else {
        onBanner('success', `${r.lineas.length} saldos listos para revisar.`);
      }
    } catch (error) {
      onBanner('critical', (error as Error).message);
    }
  };

  return (
    <>
      <BarraSubida editable={editable} onPrelLenar={prellenar} />
      <TablaLineas lineas={lineas} editable={editable} setLineas={setLineas} />
    </>
  );
}

const LABEL_CSV = {
  display: 'inline-flex',
  gap: 8,
  alignItems: 'center',
  border: '2px solid var(--black)',
  borderRadius: 10,
  padding: '6px 12px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

function BarraSubida({
  editable,
  onPrelLenar,
}: {
  readonly editable: boolean;
  readonly onPrelLenar: (f: File | null) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        margin: '24px 0 10px',
        flexWrap: 'wrap',
      }}
    >
      <h2 style={{ fontSize: portalFontSizes.sectionTitle, fontWeight: 800, margin: 0 }}>
        Cuentas por cobrar iniciales
      </h2>
      {editable ? (
        <label style={LABEL_CSV}>
          Prellenar desde .csv
          <input
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => onPrelLenar(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : null}
      <span style={{ color: 'var(--gray-600)', fontSize: portalFontSizes.sm }}>
        columnas: nombre, teléfono, saldo
      </span>
    </div>
  );
}
