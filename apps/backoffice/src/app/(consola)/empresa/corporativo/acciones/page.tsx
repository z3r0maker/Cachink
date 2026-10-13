import type { EventoGuardado } from '@xangarro/application/corp';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { leerLibro } from '@/server/empresa/corporativo-lectura';
import { acciones } from '@/server/empresa/corporativo-view';
import { fechaCorta } from '@/server/empresa/fechas';
import { requireFounderPage } from '@/server/founder';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { AdministradorForm, EventoForm } from '../formas';

export const dynamic = 'force-dynamic';

const texto = (e: EventoGuardado) =>
  e.tipo === 'suscripcion'
    ? `Suscripción: ${acciones(e.acciones)} acciones para el Fundador ${e.a}`
    : `Transmisión: ${acciones(e.acciones)} acciones del Fundador ${e.de ?? ''} al Fundador ${e.a}`;

function Historial({ eventos }: { readonly eventos: readonly EventoGuardado[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="historial-acciones">
      <h2 id="historial-acciones" className={s.sectionTitle}>
        Movimientos de acciones
      </h2>
      {eventos.length === 0 ? (
        <p className={m.sub}>Todavía no hay acciones registradas.</p>
      ) : (
        <ul className={a.list}>
          {[...eventos].reverse().map((e) => (
            <li key={e.id} className={a.item} data-testid="evento-acciones">
              <span className={a.whenDate}>{fechaCorta(e.fecha)}</span>
              <span>
                <span className={a.whenDate}>{texto(e)}</span>
                {e.nota === null ? null : <span className={a.itemBasis}>{e.nota}</span>}
              </span>
              <span />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The share register (E-06): until E-21's cuts write it, the founders record
 * each subscription and transfer here; each one puts its 15-business-day
 * beneficial-owner notice on the Agenda.
 */
export default async function AccionesPage() {
  await requireFounderPage();
  const libro = await leerLibro();
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>Empresa · Libro corporativo</span>
          <h1 className={m.title}>Acciones</h1>
        </div>
        <Link className={m.boton.quieto} href="/empresa/corporativo">
          Volver al libro
        </Link>
      </header>
      <div className={s.grid2}>
        <section className={`${m.hero} ${m.stack}`} aria-label="Registrar acciones">
          <EventoForm hoy={hoyEnMexico()} />
        </section>
        <div className={m.stack}>
          <section className={m.panelPad}>
            <AdministradorForm
              actual={libro.administrador === null ? '' : String(libro.administrador)}
            />
          </section>
          <Historial eventos={libro.eventos} />
        </div>
      </div>
    </div>
  );
}
