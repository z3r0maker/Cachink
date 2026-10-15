import type { Route } from 'next';
import Link from 'next/link';

import type { FilaRecurrente } from '@/server/empresa/recurrentes-view';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { DejarDeRepetir } from './dejar-de-repetir';

/**
 * Movimientos › Recurrentes (E-02, boards CD-02 and CD-03): each template's
 * charge this month, registered, suggested or still to come. A template is
 * made by ticking «Hacer recurrente cada mes» when registering an expense.
 */
const ESTADO_TAG = {
  Registrado: m.tag.ok,
  Sugerido: m.tag.sugerido,
  Próximo: m.tag.off,
} as const;

const COLUMNAS = ['Servicio', 'Categoría', 'Monto habitual', 'Cargo', 'Estado', ''] as const;

function Fila({ f, activo }: { readonly f: FilaRecurrente; readonly activo: boolean }) {
  return (
    <tr className={d.rowOpen} data-testid="recurrente">
      <td className={d.td}>
        <span className={d.tdStrong}>{f.nombre}</span>
        {f.detalle === '' ? null : <span className={d.cellSub}>{f.detalle}</span>}
      </td>
      <td className={d.td}>{f.categoria}</td>
      <td className={d.tdNum}>{f.monto}</td>
      <td className={d.td}>{f.fecha}</td>
      <td className={d.td}>
        <span className={`${m.tagBase} ${ESTADO_TAG[f.estado]}`}>{f.estado}</span>
      </td>
      <td className={d.td}>
        <div className={m.row}>
          {f.href === null ? null : (
            <Link
              className={f.estado === 'Sugerido' ? m.boton.primario : m.boton.quieto}
              href={f.href as Route}
            >
              {f.estado === 'Sugerido' ? 'Registrar' : 'Ver'}
            </Link>
          )}
          {activo ? <DejarDeRepetir plantillaId={f.id} nombre={f.nombre} /> : null}
        </div>
      </td>
    </tr>
  );
}

export function TablaRecurrentes({
  filas,
  activos,
}: {
  readonly filas: readonly FilaRecurrente[];
  /** Ids of the templates still repeating. */
  readonly activos: ReadonlySet<string>;
}) {
  if (filas.length === 0) {
    return (
      <p className={d.empty}>
        No hay gastos recurrentes en este mes. Al registrar un gasto, marca «Hacer recurrente cada
        mes».
      </p>
    );
  }
  return (
    <div className={d.tableWrap}>
      <table className={d.table}>
        <thead>
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c} className={c === 'Monto habitual' ? d.thNum : d.th} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <Fila key={f.id} f={f} activo={activos.has(f.id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
