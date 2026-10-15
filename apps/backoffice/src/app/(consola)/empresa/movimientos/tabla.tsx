import type { Route } from 'next';
import Link from 'next/link';

import type { FilaMovimiento } from '@/server/empresa/movimiento-view';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

/** The Movimientos table (E-02, board CD-02). A suggested charge opens Registrar. */
const ESTADO_TAG = {
  Registrado: m.tag.ok,
  Revertido: m.tag.off,
  Reversa: m.tag.info,
  Sugerido: m.tag.sugerido,
} as const;

function Fila({ f }: { readonly f: FilaMovimiento }) {
  return (
    <tr
      className={d.rowOpen}
      data-testid={f.estado === 'Sugerido' ? 'movimiento-sugerido' : 'movimiento'}
    >
      <td className={d.td}>{f.fecha}</td>
      <td className={d.tdStrong}>{f.tipo}</td>
      <td className={d.td}>
        <Link className={d.rowLink} href={f.href as Route}>
          {f.concepto}
        </Link>
        {f.detalle === '' ? null : <span className={d.cellSub}>{f.detalle}</span>}
      </td>
      <td className={d.td}>{f.categoria}</td>
      <td className={f.entra ? d.tdIn : d.tdNum}>{f.monto}</td>
      <td className={d.td}>
        <span className={`${m.tagBase} ${ESTADO_TAG[f.estado]}`}>{f.estado}</span>
      </td>
    </tr>
  );
}

const COLUMNAS = ['Fecha', 'Tipo', 'Concepto', 'Categoría', 'Monto', 'Estado'] as const;

export function Tabla({
  filas,
  vacio,
}: {
  readonly filas: readonly FilaMovimiento[];
  readonly vacio: string;
}) {
  if (filas.length === 0) return <p className={d.empty}>{vacio}</p>;
  return (
    <div className={d.tableWrap}>
      <table className={d.table}>
        <thead>
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c} className={c === 'Monto' ? d.thNum : d.th} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <Fila key={f.id} f={f} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
