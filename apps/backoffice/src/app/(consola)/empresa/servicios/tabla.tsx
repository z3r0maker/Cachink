import type { Route } from 'next';
import Link from 'next/link';

import type { TonoEstado } from '@/server/empresa/servicios-textos';
import {
  FILTROS_SERVICIOS,
  type FilaServicio,
  type VerServicios,
} from '@/server/empresa/servicios-view';
import * as d from '@/styles/mostrador-data.css';
import * as mf from '@/styles/mostrador-facturas.css';
import * as g from '@/styles/mostrador-graficas.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as s from '@/styles/mostrador-servicios.css';
import * as m from '@/styles/mostrador.css';

import { ROL } from './barras';

/**
 * «Todos los servicios» (E-24, board CD-18): one row per service with its
 * category, how it charges, its average, what pays it, its next charge and
 * its state. The chips are links, so the address is the whole state.
 */
const TONO: Record<TonoEstado, string> = {
  ok: m.tag.ok,
  aviso: mf.tono.aviso,
  info: m.tag.info,
  nuevo: m.tag.sugerido,
  off: m.tag.off,
};

const COLUMNAS = [
  'Servicio',
  'Categoría',
  'Cómo cobra',
  'Promedio al mes',
  'Se paga con',
  'Próximo cargo',
  'Estado',
] as const;

function Fila({ f }: { readonly f: FilaServicio }) {
  return (
    <tr className={d.rowOpen} data-testid="servicio">
      <td className={d.td}>
        <Link className={d.rowLink} href={f.href as Route}>
          <span className={d.tdStrong}>{f.nombre}</span>
        </Link>
        {f.para === '' ? null : <span className={d.cellSub}>{f.para}</span>}
      </td>
      <td className={d.td}>
        <span className={`${s.punto} ${g.rol[ROL[f.categoriaKey]]}`} aria-hidden="true" />
        {f.categoria}
      </td>
      <td className={d.td}>{f.cobro}</td>
      <td className={d.tdNum}>{f.promedio}</td>
      <td className={d.td}>{f.pagaCon}</td>
      <td className={d.td}>{f.proximo}</td>
      <td className={d.td}>
        <span className={`${m.tagBase} ${TONO[f.estado.tono]}`}>{f.estado.texto}</span>
      </td>
    </tr>
  );
}

function Chips({ ver }: { readonly ver: VerServicios }) {
  return (
    <nav className={m.row} aria-label="Tipo de servicio">
      {FILTROS_SERVICIOS.map((f) => (
        <Link
          key={f.id}
          className={m.chip}
          href={(f.id === 'todos' ? '?' : `?ver=${f.id}`) as Route}
          aria-current={f.id === ver ? 'true' : undefined}
        >
          {f.label}
        </Link>
      ))}
    </nav>
  );
}

function Lista({ filas }: { readonly filas: readonly FilaServicio[] }) {
  return (
    <div className={d.tableWrap}>
      <table className={d.table}>
        <thead>
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c} className={c === 'Promedio al mes' ? d.thNum : d.th} scope="col">
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

export function TablaServicios(props: {
  readonly filas: readonly FilaServicio[];
  readonly total: number;
  readonly ver: VerServicios;
}) {
  const vacio =
    props.total === 0
      ? 'Todavía no hay servicios. Agrega el primero con «+ Nuevo servicio».'
      : 'Ningún servicio de este tipo.';
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="lista">
      <div className={m.row}>
        <h2 id="lista" className={r.titular}>
          Todos los servicios · {props.total}
        </h2>
        <Chips ver={props.ver} />
      </div>
      {props.filas.length === 0 ? (
        <p className={d.empty}>{vacio}</p>
      ) : (
        <Lista filas={props.filas} />
      )}
      <p className={s.nota}>
        Cada servicio crea su gasto recurrente en Movimientos; las comisiones de Stripe se registran
        con cada depósito.
      </p>
    </section>
  );
}
