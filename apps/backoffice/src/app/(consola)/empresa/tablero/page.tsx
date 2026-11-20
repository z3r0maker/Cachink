import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { leerElTablero, socioDe } from '@/server/empresa/tablero-lectura';
import {
  hrefTablero,
  parseTablero,
  vecinos,
  type ParamsTablero,
} from '@/server/empresa/tablero-view';
import { vistaDelTablero } from '@/server/empresa/tablero-vista';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Kanban } from './kanban';
import { Paneles } from './paneles';
import { Plan } from './plan';
import { Arrastre, Banner, Objetivos, Socios } from './resumen';

export const dynamic = 'force-dynamic';

function Navegacion({
  p,
  hoy,
  agregar,
}: {
  readonly p: ParamsTablero;
  readonly hoy: string;
  readonly agregar: boolean;
}) {
  const v = vecinos(p.trimestre, hoy);
  return (
    <nav className={m.row} aria-label="Trimestre">
      <Link className={m.boton.secundario} href={hrefTablero(v.anterior) as Route}>
        Trimestre anterior
      </Link>
      {v.siguiente === null ? null : (
        <Link className={m.boton.secundario} href={hrefTablero(v.siguiente) as Route}>
          Trimestre siguiente
        </Link>
      )}
      {agregar ? (
        <Link
          className={m.boton.primario}
          href={hrefTablero(p.trimestre, { panel: 'nueva' }) as Route}
        >
          + Nueva tarjeta
        </Link>
      ) : null}
    </nav>
  );
}

/**
 * Socios › Tablero (E-20, boards CD-13b to CD-13d): one quarter at a time,
 * each partner's commitment against what was accepted, the objectives, the
 * plan while it is built and the kanban once it runs. Drawers open with
 * `?panel=`, `?tarjeta=` and `?objetivo=`.
 */
export default async function TableroPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { founder } = await requireFounderPage();
  const hoy = hoyEnMexico();
  const p = parseTablero(await props.searchParams, hoy);
  const l = await leerElTablero(hoy, p.trimestre);
  const yo = socioDe(founder.numero);
  const v = vistaDelTablero(l, p, yo);
  return (
    <div className={m.page}>
      <EncabezadoSeccion actual="/empresa/tablero" sub={v.periodo}>
        <Navegacion p={p} hoy={hoy} agregar={v.puedeAgregar} />
      </EncabezadoSeccion>
      {v.banners.map((b) => (
        <Banner key={b.titulo} b={b} />
      ))}
      <Socios socios={v.socios} desbalance={v.desbalance} />
      <Objetivos v={v} trimestre={p.trimestre} />
      {v.arrastre === null ? null : <Arrastre a={v.arrastre} />}
      {v.plan === null ? null : <Plan v={v} trimestre={p.trimestre} nombres={l.nombres} />}
      {v.columnas === null ? null : <Kanban columnas={v.columnas} p={p} />}
      <Paneles l={l} p={p} v={v} yo={yo} />
    </div>
  );
}
