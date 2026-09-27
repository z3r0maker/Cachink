'use client';

import { useState } from 'react';

import { Button } from '@/components';
import type { PreviewRow } from '@/server/import/templates';

import { ENVUELVE } from '../_primeros/boton';
import { IconoBajar, IconoFlecha } from '../_primeros/iconos';
import * as p from '../_primeros/primeros.css';
import type { TemplateMeta } from './plantillas';
import { TablaRevision } from './tabla-revision';
import type { Importar } from './use-importar';
import * as s from './revision.css';

/** Step 2's review (P-07): what the file will do, row by row, before anything is written. */
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

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function Resumen({ rows }: { readonly rows: readonly PreviewRow[] }) {
  const n = (k: PreviewRow['kind']) => rows.filter((r) => r.kind === k).length;
  return (
    <p className={s.resumen} data-testid="import-resumen">
      <span className={s.cuenta.nuevo}>{plural(n('nuevo'), 'nuevo', 'nuevos')}</span>,{' '}
      <span className={s.cuenta.actualizar}>
        {plural(n('actualizar'), 'se actualiza', 'se actualizan')}
      </span>
      , <span className={s.cuenta['sin-cambios']}>{n('sin-cambios')} sin cambios</span>,{' '}
      <span className={s.cuenta.error}>{n('error')} por revisar</span>
    </p>
  );
}

export function Revision({
  rows,
  meta,
  f,
}: {
  readonly rows: readonly PreviewRow[];
  readonly meta: TemplateMeta;
  readonly f: Importar;
}) {
  const [soloErrores, setSoloErrores] = useState(false);
  const errores = rows.filter((r) => r.kind === 'error');
  const shown = soloErrores ? errores : rows;
  return (
    <>
      <div className={s.resumenFila}>
        <Resumen rows={rows} />
        <Filtros
          soloErrores={soloErrores}
          total={rows.length}
          errores={errores.length}
          onCambio={setSoloErrores}
        />
      </div>
      <TablaRevision rows={shown} meta={meta} />
      {soloErrores && errores.length > 0 ? (
        <p className={`${p.nota} ${s.nadaQueVer}`}>
          Estas no se importan: corrígelas en tu archivo y súbelo otra vez.
        </p>
      ) : null}
      <Acciones rows={rows} meta={meta} f={f} errores={errores.length} />
    </>
  );
}

function Filtros(props: {
  readonly soloErrores: boolean;
  readonly total: number;
  readonly errores: number;
  readonly onCambio: (solo: boolean) => void;
}) {
  return (
    <div role="group" aria-label="Filtrar filas" className={s.filtros}>
      <button
        type="button"
        className={s.filtro}
        aria-pressed={!props.soloErrores}
        onClick={() => props.onCambio(false)}
      >
        Todas · {props.total}
      </button>
      <button
        type="button"
        className={s.filtro}
        aria-pressed={props.soloErrores}
        onClick={() => props.onCambio(true)}
      >
        Por revisar · {props.errores}
      </button>
    </div>
  );
}

function Acciones({
  rows,
  meta,
  f,
  errores,
}: {
  readonly rows: readonly PreviewRow[];
  readonly meta: TemplateMeta;
  readonly f: Importar;
  readonly errores: number;
}) {
  const n = rows.filter((r) => r.kind === 'nuevo' || r.kind === 'actualizar').length;
  return (
    <div className={s.barra}>
      {errores > 0 ? (
        <button type="button" className={s.liga} onClick={() => descargarErrores(rows)}>
          <IconoBajar />
          Descargar los que faltan
        </button>
      ) : null}
      <span className={s.empuja} />
      <Button
        variant="primary"
        size="lg"
        style={ENVUELVE}
        disabled={f.pending || n === 0}
        onClick={f.importar}
      >
        {f.pending ? 'Importando…' : `Importar ${n} ${meta.label.toLowerCase()}`}
        {f.pending ? null : <IconoFlecha />}
      </Button>
    </div>
  );
}
