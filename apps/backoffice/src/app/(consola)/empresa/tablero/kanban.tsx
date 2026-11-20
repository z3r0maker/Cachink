import type { Route } from 'next';
import Link from 'next/link';

import type { TarjetaVista } from '@/server/empresa/tablero-tarjeta-vista';
import {
  FILTROS,
  hrefTablero,
  type Filtro,
  type ParamsTablero,
} from '@/server/empresa/tablero-view';
import type { ColumnaVista } from '@/server/empresa/tablero-vista';
import * as i from '@/styles/mostrador-impuestos.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

/** The quarter's kanban (board CD-13b): the filter chips and four columns of cards. */
const ETIQUETA: Record<Filtro, string> = {
  todo: 'Todo',
  f1: 'Fundador 1',
  f2: 'Fundador 2',
  entregables: 'Entregables',
  tareas: 'Tareas',
  obligaciones: 'Obligaciones',
};

const CLASE = { entregable: 'Entregable', tarea: 'Tarea', obligacion: 'Obligación' } as const;

function Tarjeta({ k }: { readonly k: TarjetaVista }) {
  return (
    <Link className={t.tarjeta} href={k.href as Route} data-testid="tablero-tarjeta">
      <span className={t.tarjetaCabeza}>
        <span className={`${m.tagBase} ${t.clase[k.clase]}`}>{CLASE[k.clase]}</span>
        {k.valor === null ? null : <span className={t.tarjetaTitulo}>{k.valor}</span>}
      </span>
      <span className={t.tarjetaTitulo}>{k.titulo}</span>
      {k.criterio === '' ? null : <span className={t.tarjetaCriterio}>{k.criterio}</span>}
      {k.estado === null ? null : (
        <span className={`${t.estado} ${i.tono[k.tono]}`}>{k.estado}</span>
      )}
      <span className={t.tarjetaPie}>
        <span>
          {k.quien} · {k.fecha}
        </span>
        {k.objetivo === null ? null : <span>{k.objetivo}</span>}
      </span>
    </Link>
  );
}

export function Kanban(props: {
  readonly columnas: readonly ColumnaVista[];
  readonly p: ParamsTablero;
}) {
  const { p } = props;
  return (
    <section className={m.stack} aria-label="Tablero del trimestre">
      <nav className={m.row} aria-label="Filtrar tarjetas">
        {FILTROS.map((f) => (
          <Link
            key={f}
            className={m.chip}
            href={hrefTablero(p.trimestre, { ver: f }) as Route}
            aria-current={p.ver === f}
          >
            {ETIQUETA[f]}
          </Link>
        ))}
      </nav>
      <div className={t.kanban}>
        {props.columnas.map((c) => (
          <Columna key={c.columna} c={c} />
        ))}
      </div>
    </section>
  );
}

function Columna({ c }: { readonly c: ColumnaVista }) {
  return (
    <section
      className={`${t.columnaBase} ${t.columna[c.columna]}`}
      aria-label={c.titulo}
      data-testid={`columna-${c.columna}`}
    >
      <span className={t.columnaTitulo}>
        <span>{c.titulo}</span>
        <span>{c.tarjetas.length}</span>
      </span>
      <span className={t.leyenda}>{c.pista}</span>
      {c.tarjetas.length === 0 ? <span className={t.leyenda}>—</span> : null}
      {c.tarjetas.map((k) => (
        <Tarjeta key={k.clave} k={k} />
      ))}
    </section>
  );
}
