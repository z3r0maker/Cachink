import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import { formatDate, formatDateLong, parseIsoDate } from '@xangarro/domain';
import type { TipoEvidencia } from '@xangarro/domain/corp';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { leerObligacion } from '@/server/empresa/agenda-lectura';
import { etiquetaEstado, recorrido } from '@/server/empresa/agenda-view';
import { fechaCorta } from '@/server/empresa/fechas';
import { accionesDe, NOMBRE_DOCUMENTO, tituloDe } from '@/server/empresa/obligacion-view';
import { requireFounderPage } from '@/server/founder';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { Acciones, Subir } from './acciones';

export const dynamic = 'force-dynamic';

/** What a founder may attach here: the template's proofs, the payment slip, anything else. */
function tiposDe(o: ObligacionVista): TipoEvidencia[] {
  const propios = Object.values(o.plantilla.evidencia);
  const linea: TipoEvidencia[] = o.plantilla.pasos.includes('pagada') ? ['linea_captura'] : [];
  return [...new Set<TipoEvidencia>([...propios, ...linea, 'otro'])];
}

function Documentos({ docs }: { readonly docs: readonly DocumentoMeta[] }) {
  if (docs.length === 0) return <p className={m.sub}>Todavía no hay documentos.</p>;
  return (
    <ul className={a.list}>
      {docs.map((doc) => (
        <li key={doc.id} className={a.item} data-testid="documento">
          <span className={a.when}>
            <span className={a.whenDate}>{fechaCorta(doc.subidoEn.slice(0, 10))}</span>
          </span>
          <span>
            <span className={a.whenDate}>{doc.nombre}</span>
            <span className={a.itemBasis}>
              {NOMBRE_DOCUMENTO[doc.tipo]} · se guarda hasta el{' '}
              {formatDate(parseIsoDate(doc.retenerHasta))}
            </span>
          </span>
          <a
            className={m.boton.secundario}
            href={`/empresa/documentos/${doc.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver
          </a>
        </li>
      ))}
    </ul>
  );
}

function Encabezado({ o }: { readonly o: ObligacionVista }) {
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>
          {o.plantilla.autoridad} · vence el {formatDateLong(parseIsoDate(o.vence))}
        </span>
        <h1 className={m.title}>{tituloDe(o)}</h1>
        <p className={m.sub}>
          {[o.plantilla.fundamento, recorrido(o.nominal, o.vence)].filter(Boolean).join('. ')}
        </p>
      </div>
      <Link className={m.boton.quieto} href="/empresa/agenda">
        Volver a la agenda
      </Link>
    </header>
  );
}

/**
 * One obligation (E-04, board CD-05's detail): when it is due and why, its
 * documents, and the steps they allow. Nothing is marked presentada without
 * its acuse, nor pagada without its proof.
 */
export default async function ObligacionPage(props: {
  params: Promise<{ plantilla: string; periodo: string }>;
}) {
  await requireFounderPage();
  const { plantilla, periodo } = await props.params;
  const detalle = await leerObligacion(plantilla, periodo);
  if (detalle === null) notFound();
  const { vista: o, documentos } = detalle;
  const clave = { plantilla, periodo };
  return (
    <div className={m.page}>
      <Encabezado o={o} />
      <section className={`${m.hero} ${m.stack}`} aria-label="Estado">
        <span className={m.eyebrow}>Estado</span>
        <span className={a.chip[o.cumplida ? 'ok' : 'off']} data-testid="estado">
          {etiquetaEstado(o.plantilla, o.estado, o.sinPago)}
        </span>
        <Acciones {...clave} acciones={accionesDe(o, documentos)} />
      </section>
      <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="documentos">
        <h2 id="documentos" className={s.sectionTitle}>
          Documentos
        </h2>
        <Documentos docs={documentos} />
        <Subir {...clave} tipos={tiposDe(o)} />
      </section>
    </div>
  );
}
