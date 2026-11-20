import { aceptadoDelTrimestre } from '@xangarro/application/corp';
import { nombreTrimestre, trimestreAnterior, trimestreDe } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { fechaCorta, nombreMes } from '@/server/empresa/fechas';
import { hrefTablero } from '@/server/empresa/tablero-view';
import { acumulado, primerDia, tiles, trimestres } from '@/server/empresa/trimestre-cifras';
import { leerTrimestre, type LecturaTrimestre } from '@/server/empresa/trimestre-lectura';
import { cumplimiento, objetivos, socios } from '@/server/empresa/trimestre-revision';
import {
  anios,
  cuartos,
  hrefTrimestre,
  parseTrimestre,
  type Opcion,
} from '@/server/empresa/trimestre-view';
import { requireFounderPage } from '@/server/founder';
import * as d from '@/styles/mostrador-data.css';
import * as q from '@/styles/mostrador-trimestre.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Acumulados, Crecimiento, Principal } from './cifras';
import { ExportarPdf } from './controles';
import { Cumplimiento, Objetivos, Socios } from './revision';

export const dynamic = 'force-dynamic';

function Chips({
  label,
  opciones,
}: {
  readonly label: string;
  readonly opciones: readonly Opcion[];
}) {
  return (
    <nav className={m.row} aria-label={label} data-no-imprimir>
      {opciones.map((o) =>
        o.href === null ? (
          <span key={o.label} className={m.chip} aria-disabled="true">
            {o.label}
          </span>
        ) : (
          <Link key={o.label} className={m.chip} href={o.href as Route} aria-current={o.actual}>
            {o.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function Vacio({ l, primero }: { readonly l: LecturaTrimestre; readonly primero: string | null }) {
  const inicio = primero === null ? null : trimestreDe(primero);
  return (
    <section className={m.panel}>
      <p className={d.empty}>
        {`El ${nombreTrimestre(l.trimestre)} no tiene movimientos.`}
        {inicio === null ? ' Registra el primero y el resumen aparece aquí.' : ''}
      </p>
      {inicio === null ? null : (
        <div className={m.pad}>
          <Link className={m.boton.primario} href={hrefTrimestre(inicio) as Route}>
            {`Ver el ${nombreTrimestre(inicio)}`}
          </Link>
        </div>
      )}
    </section>
  );
}

function Resumen({ l, primero }: { readonly l: LecturaTrimestre; readonly primero: string }) {
  const t = nombreTrimestre(l.trimestre);
  const antes = nombreTrimestre(trimestreAnterior(l.trimestre)).split(' ')[0] ?? '';
  const meses = `${nombreMes(l.rango.desde.slice(0, 7))} a ${nombreMes(`${l.trimestre.slice(0, 4)}-${String(Number(l.trimestre.slice(6)) * 3).padStart(2, '0')}`)}`;
  const enCurso = l.rango.estado === 'en_curso';
  const o = objetivos(l);
  const so = socios(l);
  const c = cumplimiento(l);
  return (
    <>
      <Principal
        eyebrow={`${t} · ${meses} · ${enCurso ? `en curso, al ${fechaCorta(l.hoy)}` : 'cerrado'}`}
        titulo={enCurso ? `El ${t} hasta hoy, contra el ${antes}` : `El ${t} contra el ${antes}`}
        chip={enCurso ? 'En curso' : 'Cerrado'}
        tiles={tiles(l)}
      />
      <div className={q.dos}>
        <Crecimiento barras={trimestres(l)} />
        <Acumulados
          filas={acumulado(l)}
          nota={`Del 1 de enero al ${fechaCorta(l.rango.hasta)}. Debajo: desde el primer movimiento, el ${fechaCorta(primero)} de ${primero.slice(0, 4)}.`}
        />
      </div>
      <div className={q.tres}>
        <Objetivos titulo={o.titulo} filas={o.filas} />
        <Socios filas={so.filas} fondeo={so.fondeo} tableroHref={hrefTablero(l.trimestre)} />
        <Cumplimiento cuenta={c.cuenta} lineas={c.lineas} />
      </div>
    </>
  );
}

/**
 * Socios › Trimestre (E-17, board CD-17b): how the quarter went against the
 * one before, in figures only (owner decision 2026-11-20): no written
 * headline or review until the analista de cierre (E-32). «Exportar PDF»
 * prints this page.
 */
export default async function TrimestrePage(props: { searchParams: Promise<{ t?: string }> }) {
  await requireFounderPage();
  const hoy = hoyEnMexico();
  const trimestre = parseTrimestre((await props.searchParams).t, hoy);
  const l = await leerTrimestre(trimestre, hoy);
  const primero = primerDia(l);
  // A quarter with Tablero activity but no entries still has a summary to read.
  const tablero = aceptadoDelTrimestre(l.tablero, trimestre, hoy).cubierto;
  const conDatos = (primero !== null && primero <= l.rango.hasta) || tablero;
  return (
    <div className={m.page} id="resumen-trimestre">
      <EncabezadoSeccion
        actual="/empresa/trimestre"
        sub={`Trimestre · ${nombreTrimestre(trimestre)}`}
      >
        <div className={m.row}>
          <Chips
            label="Año"
            opciones={anios(trimestre, Number((primero ?? hoy).slice(0, 4)), hoy)}
          />
          <Chips label="Trimestre" opciones={cuartos(trimestre, hoy)} />
          {conDatos ? <ExportarPdf /> : null}
        </div>
      </EncabezadoSeccion>
      {conDatos ? (
        <Resumen l={l} primero={primero ?? l.rango.desde} />
      ) : (
        <Vacio l={l} primero={primero} />
      )}
    </div>
  );
}
