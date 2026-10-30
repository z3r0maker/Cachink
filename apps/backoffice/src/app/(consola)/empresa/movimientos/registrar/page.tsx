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
import { leerPanelXml } from '@/server/empresa/facturas-lectura';
import { prefillDe } from '@/server/empresa/prefill';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { CapturaForm } from './captura-form';
import { ConXml } from './con-xml';

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
 * `?plantilla=&mes=` on a recurring charge, prefilled. `?factura=` opens
 * on the XML just attached (E-11, board CD-06d) while it still waits.
 */
export default async function RegistrarPage(props: {
  searchParams: Promise<{ tipo?: string; plantilla?: string; mes?: string; factura?: string }>;
}) {
  await requireFounderPage();
  const db = requireCorpDb();
  const [{ tipo, plantilla, mes, factura }, proyectos, founders] = await Promise.all([
    props.searchParams,
    listProjects(db),
    listFounders(db),
  ]);
  const [prefill, panel] = await Promise.all([
    prefillDeLaUrl(db, plantilla, mes),
    factura === undefined ? null : leerPanelXml(factura),
  ]);
  const { opciones, socios } = opcionesDe(proyectos, founders);
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Empresa · Movimientos</span>
          <h1 className={m.title}>{panel === null ? 'Registrar' : 'Registrar gasto'}</h1>
        </div>
      </header>
      <section className={`${m.hero} ${m.narrow}`} aria-label="Registrar movimiento">
        {panel === null ? (
          <CapturaForm
            nonce={`manual-${newUlid()}`}
            hoy={hoyEnMexico()}
            tipo={tipo !== undefined && TIPOS.has(tipo) ? tipo : 'gasto'}
            prefill={prefill}
            proyectos={opciones}
            socios={socios}
          />
        ) : (
          <ConXml panel={panel} proyectos={opciones} />
        )}
      </section>
    </div>
  );
}
