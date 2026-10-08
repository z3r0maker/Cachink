import { listFundingCalls } from '@xangarro/data-corp';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { leerAgenda } from '@/server/empresa/agenda-lectura';
import { grupos, itemsDeFondeo } from '@/server/empresa/agenda-view';
import { requireFounderPage } from '@/server/founder';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { EncabezadoAgenda } from './encabezado';
import { AgregarFechaForm, InscripcionForm } from './formas';
import { Exentas, Proximos } from './proximos';

export const dynamic = 'force-dynamic';

function SinInscripcion({ hoy }: { readonly hoy: string }) {
  return (
    <section className={`${m.hero} ${m.stack}`} aria-labelledby="inscripcion">
      <span className={m.eyebrow}>Antes de empezar</span>
      <h2 id="inscripcion" className={s.heroTitle}>
        ¿Cuándo se inscribió MEXIA al RFC?
      </h2>
      <p className={m.sub}>
        Las declaraciones mensuales empiezan ese mes. Con la fecha, la agenda calcula cada
        obligación y su vencimiento.
      </p>
      <InscripcionForm hoy={hoy} />
    </section>
  );
}

/**
 * Agenda › Próximos (E-04, board CD-05): what is late, what is due in the
 * next two weeks and what comes later, to SAT, Economía, IMPI and between
 * the partners, with the obligations that do not apply and why.
 */
export default async function AgendaPage() {
  await requireFounderPage();
  const hoy = hoyEnMexico();
  const [agenda, calls] = await Promise.all([leerAgenda(hoy), listFundingCalls(requireCorpDb())]);
  return (
    <div className={m.page}>
      <EncabezadoAgenda activo="proximos" />
      {agenda.inscripcion === null ? <SinInscripcion hoy={hoy} /> : null}
      <div className={a.layout}>
        <Proximos grupos={grupos(agenda.vistas, hoy, itemsDeFondeo(calls, hoy))} />
        <div className={m.stack}>
          <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="agregar">
            <h2 id="agregar" className={s.sectionTitle}>
              Agregar una fecha
            </h2>
            <AgregarFechaForm />
          </section>
          <Exentas />
        </div>
      </div>
    </div>
  );
}
