import { listProjects } from '@xangarro/data-corp';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { requireCorpDb } from '@/server/db/corp';
import { leerRevision } from '@/server/empresa/facturas-lectura';
import { RECHAZOS_COOKIE } from '@/server/empresa/facturas-rutas';
import {
  fueraDe,
  leerRechazos,
  resumenRevision,
  type FueraDeRevision,
} from '@/server/empresa/revision-view';
import { requireFounderPage } from '@/server/founder';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { RevisionForm } from './revision-form';

export const dynamic = 'force-dynamic';

function Fuera({ fuera }: { readonly fuera: readonly FueraDeRevision[] }) {
  if (fuera.length === 0) return null;
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="no">
      <h2 id="no" className={m.tileLabel}>
        No se registran
      </h2>
      {fuera.map((x) => (
        <div key={`${x.titulo}-${x.texto}`} className={mf.fuera} data-testid="factura-fuera">
          <span className={`${m.tagBase} ${mf.tono[x.tono]}`}>{x.etiqueta}</span>
          <div className={mf.fueraTexto}>
            <span className={mf.nombre}>{x.titulo}</span>
            <span className={d.cellSub}>{x.texto}</span>
          </div>
          {x.entryId === null ? null : (
            <Link
              className={m.boton.secundario}
              href={`/empresa/movimientos/${x.entryId}` as Route}
            >
              Ver movimiento
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * «Revisa antes de registrar» (E-11, board CD-06c): each uploaded invoice
 * ready to register, with its category and project, and each file set aside
 * with its reason. Right after an upload, its refusals come in a short-lived
 * cookie; nothing else keeps them.
 */
export default async function RevisarPage(props: { searchParams: Promise<{ subidas?: string }> }) {
  await requireFounderPage();
  const recienSubidas = (await props.searchParams).subidas === '1';
  const raw = recienSubidas ? (await cookies()).get(RECHAZOS_COOKIE)?.value : undefined;
  const fuera = leerRechazos(raw).map(fueraDe);
  const [tarjetas, proyectos] = await Promise.all([leerRevision(), listProjects(requireCorpDb())]);
  const opciones = [
    ...proyectos.map((p) => ({ value: p.id, title: p.nombre })),
    { value: '', title: 'Compartido', text: 'De la empresa, no de un proyecto.' },
  ];
  return (
    <div className={`${m.page} ${m.narrow}`}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Empresa · Facturas</span>
          <h1 className={m.title}>Revisa antes de registrar</h1>
          <p className={m.sub}>
            {tarjetas.length === 0 && fuera.length === 0
              ? 'No hay facturas por revisar.'
              : resumenRevision(tarjetas.length, fuera.length, recienSubidas)}
          </p>
        </div>
      </header>
      <RevisionForm tarjetas={tarjetas} proyectos={opciones}>
        <Fuera fuera={fuera} />
      </RevisionForm>
    </div>
  );
}
