import type { Route } from 'next';
import Link from 'next/link';

import {
  cambiarTipo,
  columnaPeriodo,
  hrefResultados,
  nombrePeriodo,
  vecinos,
  type VistaResultados,
} from '@/server/empresa/resultados-view';
import * as a from '@/styles/mostrador-agenda.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';

const TIPOS = [
  { tipo: 'mes', label: 'Mes' },
  { tipo: 'trimestre', label: 'Trimestre' },
  { tipo: 'anio', label: 'Año' },
] as const;

const BASES = [
  { base: 'devengado', label: 'Devengado', explica: 'Devengado: lo facturado en el periodo.' },
  {
    base: 'flujo',
    label: 'Flujo',
    explica: 'Flujo: lo cobrado y pagado; así se calculan los impuestos en RESICO.',
  },
] as const;

function Selectores(props: {
  readonly v: VistaResultados;
  readonly href: (c: Partial<VistaResultados>) => Route;
}) {
  const { v, href } = props;
  return (
    <div className={r.controles}>
      <nav className={a.tabs} aria-label="Periodo">
        {TIPOS.map((t) => (
          <Link
            key={t.tipo}
            className={a.tab}
            href={href({ periodo: cambiarTipo(v.periodo, t.tipo) })}
            aria-current={v.periodo.tipo === t.tipo ? 'page' : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <nav className={a.tabs} aria-label="Base">
        {BASES.map((b) => (
          <Link
            key={b.base}
            className={a.tab}
            href={href({ base: b.base })}
            aria-current={v.base === b.base ? 'page' : undefined}
          >
            {b.label}
          </Link>
        ))}
      </nav>
      <p className={r.explica}>{BASES.find((b) => b.base === v.base)?.explica}</p>
    </div>
  );
}

/**
 * Resultados' title, its period and basis selectors and the period links
 * (board CD-07). Every choice is a link, so the page needs no client code.
 */
export function EncabezadoResultados({ v }: { readonly v: VistaResultados }) {
  const { anterior, siguiente } = vecinos(v.periodo);
  const href = (c: Partial<VistaResultados>) => hrefResultados(v, { abrir: null, ...c }) as Route;
  return (
    <>
      <EncabezadoSeccion
        actual="/empresa/resultados"
        sub={`${nombrePeriodo(v.periodo)} vs ${columnaPeriodo(anterior).toLowerCase()}`}
      >
        <div className={m.row}>
          <Link className={m.boton.quieto} href={href({ periodo: anterior })}>
            Periodo anterior
          </Link>
          <Link className={m.boton.quieto} href={href({ periodo: siguiente })}>
            Periodo siguiente
          </Link>
        </div>
      </EncabezadoSeccion>
      <Selectores v={v} href={href} />
    </>
  );
}
