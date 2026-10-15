import {
  createRecurringTemplateRepository,
  listFounders,
  listProjects,
  type CorpDb,
  type Founder,
  type Project,
} from '@xangarro/data-corp';
import { newUlid } from '@xangarro/domain';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { prefillDe } from '@/server/empresa/prefill';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { CapturaForm } from './captura-form';

export const dynamic = 'force-dynamic';

const TIPOS = new Set(['gasto', 'comision', 'socios']);

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `?plantilla=&mes=` from a «Sugerido» row; an unknown template opens a blank form. */
async function prefillDeLaUrl(db: CorpDb, plantilla?: string, mes?: string) {
  if (plantilla === undefined || mes === undefined || !MES.test(mes)) return null;
  const p = await createRecurringTemplateRepository(db).findById(plantilla);
  return p === null ? null : prefillDe(p, mes);
}

function opcionesDe(proyectos: readonly Project[], founders: readonly Founder[]) {
  return {
    opciones: [
      ...proyectos.map((p) => ({ value: p.id, title: p.nombre })),
      { value: '', title: 'Compartido', text: 'De la empresa, no de un proyecto.' },
    ],
    socios: founders.map((f) => ({
      value: String(f.numero),
      title: `Fundador ${f.numero}`,
      text: f.nombre,
    })),
  };
}

/**
 * Registrar (E-02, board CD-03; partner money from E-03). The nonce makes a
 * double submit, or a retry after a failed audit, land on the same entry.
 * `?tipo=socios` opens on partner money, as Socios' button does, and
 * `?plantilla=&mes=` on a recurring charge, prefilled.
 */
export default async function RegistrarPage(props: {
  searchParams: Promise<{ tipo?: string; plantilla?: string; mes?: string }>;
}) {
  await requireFounderPage();
  const db = requireCorpDb();
  const [{ tipo, plantilla, mes }, proyectos, founders] = await Promise.all([
    props.searchParams,
    listProjects(db),
    listFounders(db),
  ]);
  const prefill = await prefillDeLaUrl(db, plantilla, mes);
  const { opciones, socios } = opcionesDe(proyectos, founders);
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
          prefill={prefill}
          proyectos={opciones}
          socios={socios}
        />
      </section>
    </div>
  );
}
