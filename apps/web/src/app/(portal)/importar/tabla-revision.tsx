'use client';

import type { ProductIcon } from '@xangarro/domain';

import { ProductGlyph } from '@/components/product-glyph';
import { adivinaIcono } from '@/lib/adivina-icono';
import type { PreviewRow } from '@/server/import/templates';

import { srOnly } from '@/styles/global.css';

import * as p from '../_primeros/primeros.css';
import type { TemplateMeta } from './plantillas';
import * as s from './revision.css';

const ESTADO: Record<PreviewRow['kind'], string> = {
  nuevo: 'Nuevo',
  actualizar: 'Ya existe: se actualiza',
  'sin-cambios': 'Sin cambios',
  error: 'Revisa',
};

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || '?';

/** The file's rows: line, who, and what the import will do with it. */
export function TablaRevision({
  rows,
  meta,
}: {
  readonly rows: readonly PreviewRow[];
  readonly meta: TemplateMeta;
}) {
  if (rows.length === 0) {
    return (
      <p className={`${p.texto} ${s.nadaQueVer}`}>Nada por revisar: todas las filas están bien.</p>
    );
  }
  return (
    <div className={s.scroll}>
      <table className={s.tabla}>
        <caption className={srOnly}>Filas de tu archivo</caption>
        <thead>
          <tr>
            <th scope="col" className={s.thFila}>
              Fila
            </th>
            <th scope="col" className={s.th}>
              {meta.id === 'productos' ? 'Producto' : 'Cliente'}
            </th>
            <th scope="col" className={s.thEstado}>
              Qué pasará
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fila key={r.line} r={r} productos={meta.id === 'productos'} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fila({ r, productos }: { readonly r: PreviewRow; readonly productos: boolean }) {
  const nombre = r.nombre || r.sku || 'Sin nombre';
  return (
    <tr>
      <td className={`${s.td} ${s.linea}`}>{r.line}</td>
      <td className={s.td}>
        <span className={s.quien}>
          <span className={s.glifo} aria-hidden="true">
            {productos ? (
              <ProductGlyph icon={adivinaIcono(nombre) as ProductIcon} size={16} />
            ) : (
              iniciales(nombre)
            )}
          </span>
          <span style={{ minWidth: 0 }}>
            <span className={s.nombre}>{nombre}</span>
            {r.sku !== '' && r.nombre !== '' ? <span className={p.nota}>{r.sku}</span> : null}
          </span>
        </span>
      </td>
      <td className={s.td}>
        <span className={`${s.chip} ${s.chipTono[r.kind]}`}>
          <span className={s.chipPunto} aria-hidden="true" />
          {r.kind === 'error' && r.errors.length > 0
            ? `${ESTADO.error}: ${r.errors.join('; ')}`
            : ESTADO[r.kind]}
        </span>
      </td>
    </tr>
  );
}
