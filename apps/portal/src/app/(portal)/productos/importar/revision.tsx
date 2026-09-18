'use client';

import { useState } from 'react';

import { Button, FilterChip, Tag, type Tone } from '@/components';
import type { PreviewRow } from '@/server/actions/importar-productos';

import { chipRow } from '../sheet/sheet.css';

/** Step 2 (P-07): what the file will do, row by row, before anything is written. */
const LABEL: Record<PreviewRow['kind'], [string, Tone]> = {
  nuevo: ['Nuevo', 'success'],
  actualizar: ['Actualizar', 'brand'],
  'sin-cambios': ['Sin cambios', 'neutral'],
  error: ['Error', 'danger'],
};

function descargarErrores(rows: readonly PreviewRow[]): void {
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows
    .filter((r) => r.kind === 'error')
    .map((r) => [String(r.line), r.sku, r.nombre, r.errors.join('; ')].map(quote).join(','));
  const csv = ['fila,sku,nombre,motivo', ...lines].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: 'errores-importacion.csv',
  });
  a.click();
  URL.revokeObjectURL(url);
}

function RevisionTable({ rows }: { readonly rows: readonly PreviewRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Fila</th>
          <th>Producto</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.line}>
            <td>{r.line}</td>
            <td>{r.nombre || r.sku || '—'}</td>
            <td>
              <Tag tone={LABEL[r.kind][1]}>{LABEL[r.kind][0]}</Tag> {r.errors.join('; ')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Revision({ rows }: { readonly rows: readonly PreviewRow[] }) {
  const [soloErrores, setSoloErrores] = useState(false);
  const count = (k: PreviewRow['kind']) => rows.filter((r) => r.kind === k).length;
  const shown = soloErrores ? rows.filter((r) => r.kind === 'error') : rows;
  return (
    <>
      <p data-testid="import-resumen">
        {count('nuevo')} nuevos · {count('actualizar')} actualizados · {count('sin-cambios')} sin
        cambios · {count('error')} con error
      </p>
      <div className={chipRow}>
        <FilterChip
          label="Mostrar solo errores"
          selected={soloErrores}
          onSelect={() => setSoloErrores((v) => !v)}
        />
        {count('error') > 0 ? (
          <Button size="sm" variant="secondary" onClick={() => descargarErrores(rows)}>
            Descargar errores
          </Button>
        ) : null}
      </div>
      <RevisionTable rows={shown} />
    </>
  );
}
