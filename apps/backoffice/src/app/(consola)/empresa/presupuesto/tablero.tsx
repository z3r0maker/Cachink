import type { Presupuesto } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import type { Calculo } from '@/server/empresa/presupuesto-calculo';
import { avanceDelTrimestre, type Encabezado } from '@/server/empresa/presupuesto-encabezado';
import { Odometro } from '@/components/odometro';
import { lineasDe, tilesDe, type Linea, type Tile } from '@/server/empresa/presupuesto-tablero';
import type { DatosPresupuesto, VistaPresupuesto } from '@/server/empresa/presupuesto-view';
import * as c from '@/styles/mostrador-caja.css';
import * as g from '@/styles/mostrador-graficas.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as p from '@/styles/mostrador-presupuesto.css';
import * as m from '@/styles/mostrador.css';

import { ROL } from '../servicios/barras';
import { Barra } from './barra';

/**
 * Board CD-15d's budget in force: who approved it, «Preparar …» for the next
 * quarter, the four tiles and the bars by category, each a link to its
 * expenses. A quarter with no budget shows `Vacio` instead. With ADR-161's
 * motion the categories are the hero: they land with the sweep and their bars
 * fill in turn; the tiles enter and roll; an approval lands as a stamp.
 */
function Tiles({ tiles }: { readonly tiles: readonly Tile[] }) {
  return (
    <section className={`${c.tiles} ${mv.escalona}`} aria-label="Resumen del presupuesto">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`${t.aviso ? p.tileAviso : c.tile.normal} ${mv.entra}`}
          data-testid="presupuesto-tile"
        >
          <span className={m.tileLabel}>{t.label}</span>
          <Odometro className={c.valor} texto={t.valor} />
          <span className={t.aviso ? p.notaAviso : i.pasoSub}>{t.nota}</span>
        </div>
      ))}
    </section>
  );
}

function Leyenda({ vista }: { readonly vista: VistaPresupuesto }) {
  return (
    <div className={g.leyenda}>
      <span className={g.leyendaItem}>
        {(['costo_servicio', 'ventas_marketing'] as const).map((cat) => (
          <span key={cat} className={`${g.muestra} ${g.rol[ROL[cat]]}`} />
        ))}
        Gastado, en el color de su categoría
      </span>
      <span className={g.leyendaItem}>
        <span className={p.muestraProyeccion} />
        {vista === 'trimestre' ? 'Proyección del trimestre' : 'Proyección del mes'}
      </span>
      <span className={g.leyendaItem}>
        <span className={p.muestraMarca} />
        Presupuesto
      </span>
    </div>
  );
}

const NOTA = {
  mes: 'La proyección suma lo gastado hasta hoy y los cargos recurrentes que faltan del mes. Cada categoría abre sus movimientos. Las comisiones del banco quedan fuera: no tienen categoría.',
  trimestre:
    'La proyección suma lo gastado hasta hoy y, para lo que falta del trimestre, los cargos recurrentes y el promedio de lo no recurrente. Cada categoría abre sus movimientos.',
} as const;

function Renglon({ l }: { readonly l: Linea }) {
  return (
    <Link className={p.linea} href={l.href as Route} data-testid="presupuesto-linea">
      <span className={p.nombre}>
        <span className={`${g.muestra} ${g.rol[ROL[l.categoria]]}`} />
        {l.nombre}
      </span>
      <Barra l={l} />
      <span className={p.cifras}>
        <span className={i.pasoTitulo}>{l.cifras}</span>
        <span className={l.sobre ? p.sobre : i.pasoSub}>{l.nota}</span>
      </span>
    </Link>
  );
}

function Categorias({
  lineas,
  vista,
}: {
  readonly lineas: readonly Linea[];
  readonly vista: VistaPresupuesto;
}) {
  return (
    <section className={`${m.hero} ${mv.aterriza} ${mv.barrido}`} aria-labelledby="categorias">
      <div className={m.stack}>
        <div className={m.row}>
          <h2 id="categorias" className={i.pasoTitulo}>
            {vista === 'trimestre'
              ? 'Presupuesto contra real del trimestre, por categoría'
              : 'Presupuesto contra real, por categoría'}
          </h2>
          <Leyenda vista={vista} />
        </div>
        <div className={mv.escalona}>
          {lineas.map((l) => (
            <Renglon key={l.categoria} l={l} />
          ))}
        </div>
        <span className={i.pasoSub}>{NOTA[vista]}</span>
      </div>
    </section>
  );
}

export function Tablero(props: {
  readonly c: Calculo;
  readonly p: Presupuesto;
  readonly d: DatosPresupuesto;
  readonly enc: Encabezado;
  readonly vista: VistaPresupuesto;
  /** The budget was approved by the action that brought the founder here. */
  readonly sello: boolean;
}) {
  const { c: calc, enc, vista } = props;
  return (
    <>
      <div className={m.row}>
        <span
          className={props.sello ? `${i.pasoSub} ${mv.sello}` : i.pasoSub}
          data-testid="presupuesto-aprobado"
        >
          {enc.aprobado}
        </span>
        {enc.preparar === null ? null : (
          <Link className={m.boton.secundario} href={enc.preparar.href as Route}>
            {enc.preparar.texto}
          </Link>
        )}
      </div>
      <Tiles tiles={tilesDe(calc, props.p, props.d.solicitudes, vista, avanceDelTrimestre(calc))} />
      <Categorias lineas={lineasDe(calc, props.p, vista)} vista={vista} />
    </>
  );
}

export function Vacio({ enc }: { readonly enc: Encabezado }) {
  if (enc.vacio === null) return null;
  return (
    <section
      className={`${m.hero} ${i.cabeza} ${mv.aterriza} ${mv.barrido}`}
      aria-labelledby="presupuesto-vacio"
    >
      <div>
        <span className={m.eyebrow}>Presupuesto</span>
        <h2 id="presupuesto-vacio" className={i.total}>
          {enc.vacio.titulo}
        </h2>
        <p className={i.muted}>{enc.vacio.texto}</p>
      </div>
      {enc.preparar === null ? null : (
        <Link className={m.boton.primario} href={enc.preparar.href as Route}>
          {enc.preparar.texto}
        </Link>
      )}
    </section>
  );
}
