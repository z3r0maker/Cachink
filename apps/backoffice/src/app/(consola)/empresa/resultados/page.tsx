import { formatMoneyEntero } from '@xangarro/domain';
import { periodoAnterior } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { cascada, puente, tendenciaGrafica } from '@/server/empresa/resultados-graficas';
import { leerResultados, type DatosResultados } from '@/server/empresa/resultados-lectura';
import {
  columnaPeriodo,
  filasEstado,
  hrefResultados,
  movimientosDe,
  parseVista,
  porcentaje,
  type VistaResultados,
} from '@/server/empresa/resultados-view';
import { requireFounderPage } from '@/server/founder';
import * as d from '@/styles/mostrador-data.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoResultados } from './encabezado';
import { Estado } from './estado';
import { Cascada, Puente, Tendencia } from './graficas';

export const dynamic = 'force-dynamic';

const entero = (v: bigint) => formatMoneyEntero(v).replace('-', '−');

function resumenPuente(datos: DatosResultados, antes: string, ahora: string): string {
  const { actual, anterior, puente: p } = datos;
  const frase = `De ${entero(p.inicio)} en ${antes} a ${entero(p.fin)} en ${ahora}.`;
  if (p.pasos.length === 0) return `${frase} No cambió ninguna línea.`;
  if (actual.margenEbitda === null || anterior.margenEbitda === null) return frase;
  const de = porcentaje(anterior.margenEbitda);
  const a = porcentaje(actual.margenEbitda);
  return de === a
    ? `${frase} El margen se quedó en ${a}.`
    : `${frase} El margen pasó de ${de} a ${a}.`;
}

function Vacio({ v }: { readonly v: VistaResultados }) {
  return (
    <section className={m.panel}>
      <p className={d.empty}>
        Sin movimientos de resultados en el periodo. Regístralos en Movimientos y aparecen aquí.
      </p>
      <div className={m.pad}>
        <Link className={m.boton.primario} href={'/empresa/movimientos/registrar' as Route}>
          + Registrar
        </Link>
        <Link
          className={m.boton.quieto}
          href={hrefResultados(v, { periodo: periodoAnterior(v.periodo) }) as Route}
        >
          Ver el periodo anterior
        </Link>
      </div>
    </section>
  );
}

function Contenido({ v, datos }: { readonly v: VistaResultados; readonly datos: DatosResultados }) {
  const { actual, anterior } = datos;
  const ahora = columnaPeriodo(v.periodo);
  const antes = columnaPeriodo(periodoAnterior(v.periodo));
  const neta = actual.renglones.utilidad_neta;
  return (
    <>
      <Cascada
        titular={`De ${entero(actual.renglones.ingresos)} de ingresos a ${entero(neta)} de ${neta < 0n ? 'pérdida' : 'utilidad'}`}
        barras={cascada(actual)}
      />
      <div className={r.dos}>
        <Puente
          resumen={resumenPuente(datos, antes.toLowerCase(), ahora.toLowerCase())}
          pasos={puente(datos.puente, antes.toLowerCase(), ahora.toLowerCase())}
        />
        <Tendencia meses={tendenciaGrafica(datos.tendencia)} />
      </div>
      <Estado
        filas={filasEstado(actual, anterior)}
        columnas={[ahora, antes]}
        abierta={
          v.abrir === null ? null : { id: v.abrir, movimientos: movimientosDe(actual, v.abrir) }
        }
        hrefDe={(cuenta) => hrefResultados(v, { abrir: cuenta })}
        faltanGastos={actual.faltanGastos}
      />
    </>
  );
}

/**
 * Resultados (E-12, board CD-07): the period's P&L as a cascade, the EBITDA
 * bridge against the previous period, six months of income against costs,
 * and the statement. Devengado by default (OD-1), with Flujo a click away.
 */
export default async function ResultadosPage(props: {
  searchParams: Promise<{ periodo?: string; base?: string; abrir?: string }>;
}) {
  await requireFounderPage();
  const v = parseVista(await props.searchParams, hoyEnMexico());
  const datos = await leerResultados(v);
  const vacio = datos.actual.movimientos.size === 0 && datos.anterior.movimientos.size === 0;
  return (
    <div className={m.page}>
      <EncabezadoResultados v={v} />
      {vacio ? <Vacio v={v} /> : <Contenido v={v} datos={datos} />}
    </div>
  );
}
