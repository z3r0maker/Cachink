import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { heroDe } from '@/server/empresa/resumen-hero';
import { leerResumen } from '@/server/empresa/resumen-lectura';
import {
  hrefResumen,
  kpisDe,
  parseVistaResumen,
  puenteResumen,
} from '@/server/empresa/resumen-view';
import { cambiarTipo, hrefResultados, nombrePeriodo } from '@/server/empresa/resultados-view';
import { requireFounderPage } from '@/server/founder';
import type { Periodo } from '@xangarro/domain/corp';
import * as a from '@/styles/mostrador-agenda.css';
import * as r from '@/styles/mostrador-resumen.css';
import * as m from '@/styles/mostrador.css';

import { Autonomia } from './resumen-autonomia';
import { Indicadores, Senales, Utilidad, Vencimientos } from './resumen-paneles';

export const dynamic = 'force-dynamic';

const TIPOS = [
  { tipo: 'mes', label: 'Mes' },
  { tipo: 'trimestre', label: 'Trimestre' },
  { tipo: 'anio', label: 'Año' },
] as const;

function Encabezado({ periodo }: { readonly periodo: Periodo }) {
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>MEXIA · Empresa</span>
        <h1 className={m.title}>Resumen</h1>
      </div>
      <div className={m.row}>
        <nav className={a.tabs} aria-label="Periodo">
          {TIPOS.map((t) => (
            <Link
              key={t.tipo}
              className={a.tab}
              href={hrefResumen(cambiarTipo(periodo, t.tipo)) as Route}
              aria-current={periodo.tipo === t.tipo ? 'page' : undefined}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <span className={r.panelTitulo}>{nombrePeriodo(periodo)}</span>
      </div>
    </header>
  );
}

/**
 * Resumen (E-16, boards CD-12b and CD-12c): how the company is today and
 * what needs the founders. The area opens here. Autonomía is today's cash;
 * the tiles and the profit bars follow the period chosen.
 */
export default async function ResumenPage(props: { searchParams: Promise<{ periodo?: string }> }) {
  await requireFounderPage();
  const hoy = hoyEnMexico();
  const periodo = parseVistaResumen(await props.searchParams, hoy);
  const datos = await leerResumen(periodo, hoy);
  const puente = puenteResumen(datos.actual);
  return (
    <div className={m.page}>
      <Encabezado periodo={periodo} />
      <Autonomia hero={heroDe(datos.autonomia, hoy)} />
      <Indicadores kpis={kpisDe(datos.actual, datos.anterior)} />
      <div className={r.paneles}>
        <Utilidad
          filas={puente.filas}
          nota={puente.nota}
          href={hrefResultados({ periodo, base: 'devengado', abrir: null })}
        />
        <Senales senales={datos.senales} />
        <Vencimientos items={datos.proximos} />
      </div>
    </div>
  );
}
