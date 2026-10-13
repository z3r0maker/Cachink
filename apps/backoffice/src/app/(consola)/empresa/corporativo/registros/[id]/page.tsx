import { createCorporativoRepository } from '@xangarro/data-corp';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireCorpDb } from '@/server/db/corp';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { RegistroForm } from '../../formas';

export const dynamic = 'force-dynamic';

/**
 * One registry (E-06): its status, the authority's number, the next step and
 * its proof, filed in the Expediente; a second upload is its new version.
 */
export default async function RegistroPage(props: { params: Promise<{ id: string }> }) {
  await requireFounderPage();
  const { id } = await props.params;
  const r = await createCorporativoRepository(requireCorpDb()).registro(id);
  if (r === null) notFound();
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Registros y trámites · {r.autoridad}</span>
          <h1 className={m.title}>{r.nombre}</h1>
        </div>
        <div className={m.row}>
          {r.documentoId === null ? null : (
            <Link
              className={m.boton.quieto}
              href={`/empresa/expediente?carpeta=${r.carpeta}&doc=${r.documentoId}`}
            >
              Historial del documento
            </Link>
          )}
          <Link className={m.boton.quieto} href="/empresa/corporativo">
            Volver al libro
          </Link>
        </div>
      </header>
      <section className={`${m.hero} ${m.narrow}`} aria-label="Actualizar registro">
        <RegistroForm
          id={r.id}
          estado={r.estado}
          referencia={r.referencia ?? ''}
          siguiente={r.siguiente}
          alDia={r.alDia}
        />
      </section>
    </div>
  );
}
