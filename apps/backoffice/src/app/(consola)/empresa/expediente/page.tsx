import { isCarpeta, type Carpeta } from '@xangarro/domain/corp';
import Link from 'next/link';

import { leerExpediente } from '@/server/empresa/expediente-lectura';
import { conteos, filasDe, historialDe } from '@/server/empresa/expediente-view';
import { requireFounderPage } from '@/server/founder';
import * as x from '@/styles/mostrador-expediente.css';
import * as m from '@/styles/mostrador.css';

import { Carpetas, Documentos, PanelHistorial } from './partes';

export const dynamic = 'force-dynamic';

/**
 * Expediente (E-05, board CD-06): MEXIA's papers by folder, each at its
 * current version, and the selected one's history. Nothing is deleted; a new
 * version supersedes the last, and both stay five years (CFF art. 30).
 */
export default async function ExpedientePage(props: {
  searchParams: Promise<{ carpeta?: string; doc?: string }>;
}) {
  await requireFounderPage();
  const [{ carpeta: c, doc }, expediente] = await Promise.all([
    props.searchParams,
    leerExpediente(),
  ]);
  const carpeta: Carpeta = c !== undefined && isCarpeta(c) ? c : 'sat';
  const h = doc === undefined ? null : historialDe(expediente.docs, doc, expediente.contexto);
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>MEXIA · Empresa</span>
          <h1 className={m.title}>Expediente</h1>
        </div>
        <Link className={m.boton.primario} href={`/empresa/expediente/subir?carpeta=${carpeta}`}>
          + Subir documentos
        </Link>
      </header>
      <div className={x.layout}>
        <Carpetas activa={carpeta} conteos={conteos(expediente.docs)} />
        <Documentos
          filas={filasDe(expediente.docs, carpeta, expediente.contexto)}
          carpeta={carpeta}
        />
        {h === null ? null : <PanelHistorial h={h} />}
      </div>
    </div>
  );
}
