import { listProjects } from '@xangarro/data-corp';
import { newUlid } from '@xangarro/domain';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { CapturaForm } from './captura-form';

export const dynamic = 'force-dynamic';

/**
 * Registrar (E-02, board CD-03). The nonce makes a double submit, or a retry
 * after a failed audit, land on the same entry.
 */
export default async function RegistrarPage() {
  await requireFounderPage();
  const proyectos = await listProjects(requireCorpDb());
  const opciones = [
    ...proyectos.map((p) => ({ value: p.id, title: p.nombre })),
    { value: '', title: 'Compartido', text: 'De la empresa, no de un proyecto.' },
  ];
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Empresa · Movimientos</span>
          <h1 className={m.title}>Registrar</h1>
        </div>
      </header>
      <section className={`${m.hero} ${m.narrow}`} aria-label="Registrar movimiento">
        <CapturaForm nonce={`manual-${newUlid()}`} hoy={hoyEnMexico()} proyectos={opciones} />
      </section>
    </div>
  );
}
