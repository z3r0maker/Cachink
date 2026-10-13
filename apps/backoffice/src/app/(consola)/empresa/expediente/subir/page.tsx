import { isCarpeta } from '@xangarro/domain/corp';
import Link from 'next/link';

import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { SubirDocumentoForm } from '../formas';

export const dynamic = 'force-dynamic';

/**
 * «Subir documentos» (E-05): a paper no obligation asked for, the acta, a
 * contract, the founders' agreement, filed in its folder with its name.
 */
export default async function SubirPage(props: { searchParams: Promise<{ carpeta?: string }> }) {
  await requireFounderPage();
  const { carpeta } = await props.searchParams;
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Empresa · Expediente</span>
          <h1 className={m.title}>Subir documento</h1>
        </div>
        <Link className={m.boton.quieto} href="/empresa/expediente">
          Volver al expediente
        </Link>
      </header>
      <section className={`${m.hero} ${m.narrow}`} aria-label="Subir documento">
        <SubirDocumentoForm
          carpeta={carpeta !== undefined && isCarpeta(carpeta) ? carpeta : 'constitucion'}
        />
      </section>
    </div>
  );
}
