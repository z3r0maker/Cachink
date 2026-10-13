import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import { documentosDe } from '@xangarro/data-corp';
import { formatDate, parseIsoDate } from '@xangarro/domain';
import Link from 'next/link';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { leerAgenda } from '@/server/empresa/agenda-lectura';
import { etiquetaEstado, hrefDe } from '@/server/empresa/agenda-view';
import { matriz } from '@/server/empresa/evidencias-view';
import { requireFounderPage } from '@/server/founder';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { EncabezadoAgenda } from '../encabezado';
import { Matriz } from './matriz';

export const dynamic = 'force-dynamic';

const larga = (iso: string) => formatDate(parseIsoDate(iso));

/** The last four months, ending with this one. */
function ultimosMeses(hoy: string): string[] {
  const [y, mo] = hoy.split('-').map(Number) as [number, number];
  return [3, 2, 1, 0].map((back) => {
    const d = new Date(Date.UTC(y, mo - 1 - back, 1));
    return d.toISOString().slice(0, 7);
  });
}

function Datos(props: {
  readonly ultima: DocumentoMeta | null;
  readonly siguiente: ObligacionVista | null;
}) {
  return (
    <div className={m.row}>
      <span className={a.when}>
        <span className={a.authority}>Última descarga</span>
        <span className={a.whenDate}>
          {props.ultima === null ? 'Aún no' : larga(props.ultima.subidoEn.slice(0, 10))}
        </span>
      </span>
      {props.siguiente === null ? null : (
        <span className={a.when}>
          <span className={a.authority}>Siguiente</span>
          <span className={a.whenDate}>{larga(props.siguiente.vence)}</span>
        </span>
      )}
      {props.ultima === null ? null : (
        <a
          className={m.boton.secundario}
          href={`/empresa/documentos/${props.ultima.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Ver documento
        </a>
      )}
    </div>
  );
}

function Opinion(props: {
  readonly ultima: DocumentoMeta | null;
  readonly siguiente: ObligacionVista | null;
}) {
  return (
    <section className={`${m.hero} ${s.heroRow}`} aria-labelledby="opinion">
      <div className={s.heroText}>
        <span className={m.eyebrow}>La prueba del SAT</span>
        <h2 id="opinion" className={s.heroTitle}>
          Opinión de cumplimiento
        </h2>
        <p className={m.sub}>
          Si el SAT la da positiva, todas las declaraciones están presentadas y pagadas. Se descarga
          cada mes y se guarda aquí.
        </p>
      </div>
      <Datos {...props} />
    </section>
  );
}

function Anuales({ vistas }: { readonly vistas: readonly ObligacionVista[] }) {
  if (vistas.length === 0) return null;
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="anuales">
      <h2 id="anuales" className={s.sectionTitle}>
        Anuales
      </h2>
      <ul className={a.list}>
        {vistas.map((o) => (
          <li key={`${o.plantilla.id}-${o.periodo}`} className={a.item}>
            <span className={a.whenDate}>{larga(o.vence)}</span>
            <span>
              <Link className={a.itemLink} href={hrefDe(o)}>
                {o.titulo} {o.periodo}
              </Link>
            </span>
            <span className={a.chip[o.cumplida ? 'ok' : 'off']}>
              {o.estado === 'pendiente'
                ? 'Aún no'
                : etiquetaEstado(o.plantilla, o.estado, o.sinPago)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Agenda › Evidencias (E-04, board CD-05b): the SAT's opinion as the outside
 * proof that everything is filed and paid, each monthly obligation's proofs
 * by month, and the year's annual filings.
 */
export default async function EvidenciasPage() {
  await requireFounderPage();
  const hoy = hoyEnMexico();
  const agenda = await leerAgenda(hoy);
  const docs = await documentosDe(requireCorpDb(), [...agenda.ids.values()]);
  const opiniones = [...docs.values()].flat().filter((d) => d.tipo === 'opinion_32d');
  const ultima = opiniones.sort((x, y) => y.subidoEn.localeCompare(x.subidoEn))[0] ?? null;
  const meses = ultimosMeses(hoy);
  return (
    <div className={m.page}>
      <EncabezadoAgenda activo="evidencias" />
      <Opinion
        ultima={ultima}
        siguiente={
          agenda.vistas.find(
            (o) => o.plantilla.id === 'opinion_32d' && !o.cumplida && o.vence >= hoy,
          ) ?? null
        }
      />
      <Matriz filas={matriz(agenda.vistas, docs, agenda.ids, meses, hoy)} meses={meses} />
      <Anuales vistas={agenda.vistas.filter((o) => /^\d{4}$/.test(o.periodo))} />
    </div>
  );
}
