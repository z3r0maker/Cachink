import { listFounders, listProjects } from '@xangarro/data-corp';
import { newUlid } from '@xangarro/domain';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { CapturaForm } from './captura-form';

export const dynamic = 'force-dynamic';

const TIPOS = new Set(['gasto', 'comision', 'socios']);

/**
 * Registrar (E-02, board CD-03; partner money from E-03). The nonce makes a
 * double submit, or a retry after a failed audit, land on the same entry.
 * `?tipo=socios` opens on partner money, as Socios' button does.
 */
export default async function RegistrarPage(props: { searchParams: Promise<{ tipo?: string }> }) {
  await requireFounderPage();
  const db = requireCorpDb();
  const [{ tipo }, proyectos, founders] = await Promise.all([
    props.searchParams,
    listProjects(db),
    listFounders(db),
  ]);
  const opciones = [
    ...proyectos.map((p) => ({ value: p.id, title: p.nombre })),
    { value: '', title: 'Compartido', text: 'De la empresa, no de un proyecto.' },
  ];
  const socios = founders.map((f) => ({
    value: String(f.numero),
    title: `Fundador ${f.numero}`,
    text: f.nombre,
  }));
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Empresa · Movimientos</span>
          <h1 className={m.title}>Registrar</h1>
        </div>
      </header>
      <section className={`${m.hero} ${m.narrow}`} aria-label="Registrar movimiento">
        <CapturaForm
          nonce={`manual-${newUlid()}`}
          hoy={hoyEnMexico()}
          tipo={tipo !== undefined && TIPOS.has(tipo) ? tipo : 'gasto'}
          proyectos={opciones}
          socios={socios}
        />
      </section>
    </div>
  );
}
