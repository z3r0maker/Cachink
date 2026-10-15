import type { CategoriaGasto } from '@xangarro/domain/corp';
import Link from 'next/link';

import { FILTROS, type Filtro } from '@/server/empresa/movimiento-view';
import * as mv from '@/styles/mostrador-movimientos.css';
import * as m from '@/styles/mostrador.css';

/**
 * Movimientos' filters (E-02, board CD-02): the type tabs, «Recurrentes» with
 * its count, the search, and the category chips. Each is a link or a GET
 * form, so the month in the address is the whole state.
 */
export interface Vista {
  readonly mes: string;
  readonly ver: Filtro;
  readonly cat: CategoriaGasto | null;
  readonly q: string;
}

function hrefDe(v: Vista): string {
  const p = new URLSearchParams({ mes: v.mes });
  if (v.ver !== 'todos') p.set('ver', v.ver);
  if (v.cat !== null) p.set('cat', v.cat);
  if (v.q !== '') p.set('q', v.q);
  return `?${p.toString()}`;
}

export function Tipos({
  vista,
  recurrentes,
}: {
  readonly vista: Vista;
  readonly recurrentes: number;
}) {
  return (
    <nav className={m.row} aria-label="Tipo de movimiento">
      {FILTROS.map((f) => (
        <Link
          key={f.id}
          className={m.chip}
          href={hrefDe({ ...vista, ver: f.id, cat: f.id === 'recurrentes' ? null : vista.cat })}
          aria-current={f.id === vista.ver ? 'true' : undefined}
        >
          {f.id === 'recurrentes' ? `${f.label} · ${recurrentes}` : f.label}
        </Link>
      ))}
    </nav>
  );
}

export function Buscar({ vista }: { readonly vista: Vista }) {
  return (
    <form className={mv.buscar} role="search" method="get">
      <input type="hidden" name="mes" value={vista.mes} />
      {vista.ver === 'todos' ? null : <input type="hidden" name="ver" value={vista.ver} />}
      {vista.cat === null ? null : <input type="hidden" name="cat" value={vista.cat} />}
      <input
        className={mv.buscarInput}
        type="search"
        name="q"
        defaultValue={vista.q}
        aria-label="Buscar por concepto o proveedor"
        placeholder="Buscar por concepto o proveedor"
      />
      <button className={m.boton.quieto} type="submit">
        Buscar
      </button>
    </form>
  );
}

const CATEGORIAS: readonly { readonly id: CategoriaGasto | null; readonly label: string }[] = [
  { id: null, label: 'Todas' },
  { id: 'costo_servicio', label: 'Costo del servicio' },
  { id: 'ventas_marketing', label: 'Ventas y marketing' },
  { id: 'desarrollo', label: 'Desarrollo' },
  { id: 'administracion', label: 'Administración' },
];

export function Categorias({ vista }: { readonly vista: Vista }) {
  return (
    <nav className={m.row} aria-label="Categoría">
      <span className={mv.rotulo} aria-hidden="true">
        Categoría
      </span>
      {CATEGORIAS.map((c) => (
        <Link
          key={c.label}
          className={m.chip}
          href={hrefDe({ ...vista, cat: c.id })}
          aria-current={c.id === vista.cat ? 'true' : undefined}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
