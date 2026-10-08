import Link from 'next/link';

import { FILTROS, type Filtro, type FilaMovimiento } from '@/server/empresa/movimiento-view';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

/** The Movimientos table and its filter chips (E-02, board CD-02). */
const ESTADO_TAG = { Registrado: m.tag.ok, Revertido: m.tag.off, Reversa: m.tag.info } as const;

export function Filtros({ mes, activo }: { readonly mes: string; readonly activo: Filtro }) {
  return (
    <nav className={m.row} aria-label="Filtrar movimientos">
      {FILTROS.map((f) => (
        <Link
          key={f.id}
          className={m.chip}
          href={f.id === 'todos' ? `?mes=${mes}` : `?mes=${mes}&ver=${f.id}`}
          aria-current={f.id === activo ? 'true' : undefined}
        >
          {f.label}
        </Link>
      ))}
    </nav>
  );
}

function Fila({ f }: { readonly f: FilaMovimiento }) {
  return (
    <tr className={d.rowOpen} data-testid="movimiento">
      <td className={d.td}>{f.fecha}</td>
      <td className={d.tdStrong}>{f.tipo}</td>
      <td className={d.td}>
        <Link className={d.rowLink} href={`/empresa/movimientos/${f.id}`}>
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
