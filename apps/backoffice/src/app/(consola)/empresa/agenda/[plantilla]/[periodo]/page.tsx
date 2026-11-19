import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import { formatDate, formatDateLong, parseIsoDate } from '@xangarro/domain';
import {
  ETIQUETA_EVIDENCIA,
  PLANTILLA_IMPUESTOS,
  plantillaRetirada,
  type TipoEvidencia,
} from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { limiteMb } from '@/server/blobs';
import { leerObligacion } from '@/server/empresa/agenda-lectura';
import { etiquetaEstado, recorrido } from '@/server/empresa/agenda-view';
import { hrefImpuestos } from '@/server/empresa/impuestos-view';
import { accionesDe, tituloDe } from '@/server/empresa/obligacion-view';
import { requireFounderPage } from '@/server/founder';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { ListaDocumentos } from '../../../lista-documentos';
import { Acciones, Subir } from './acciones';

export const dynamic = 'force-dynamic';

/** What a founder may attach here: the template's proofs, the payment slip, anything else. */
function tiposDe(o: ObligacionVista): TipoEvidencia[] {
  const propios = Object.values(o.plantilla.evidencia);
  const linea: TipoEvidencia[] = o.plantilla.pasos.includes('pagada') ? ['linea_captura'] : [];
  return [...new Set<TipoEvidencia>([...propios, ...linea, 'otro'])];
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

function Documentos(props: {
  readonly o: ObligacionVista;
  readonly documentos: readonly DocumentoMeta[];
  readonly clave: { readonly plantilla: string; readonly periodo: string };
}) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="documentos">
      <h2 id="documentos" className={s.sectionTitle}>
        Documentos
      </h2>
      <ListaDocumentos
        docs={props.documentos}
        vacio="Todavía no hay documentos."
        detalle={(d) =>
          `${ETIQUETA_EVIDENCIA[d.tipo]} · se guarda hasta el ${formatDate(parseIsoDate(d.retenerHasta))}`
        }
      />
      {props.clave.plantilla === PLANTILLA_IMPUESTOS ? null : (
        <Subir {...props.clave} tipos={tiposDe(props.o)} limiteMb={limiteMb()} />
      )}
    </section>
  );
}

/** The monthly declaration moves in Impuestos, which also posts its payment (E-13). */
function EnImpuestos({ periodo }: { readonly periodo: string }) {
  return (
    <div className={m.row}>
      <Link className={m.boton.primario} href={hrefImpuestos(periodo) as Route}>
        Declarar y pagar en Impuestos
      </Link>
      <span className={m.sub}>Ahí se capturan las cifras del contador y se registra el pago.</span>
    </div>
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
  const nueva = plantillaRetirada(plantilla);
  if (nueva !== null) redirect(`/empresa/agenda/${nueva}/${periodo}` as Route);
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
        {plantilla === PLANTILLA_IMPUESTOS ? (
          <EnImpuestos periodo={periodo} />
        ) : (
          <Acciones {...clave} acciones={accionesDe(o, documentos)} />
        )}
      </section>
      <Documentos o={o} documentos={documentos} clave={clave} />
    </div>
  );
}
