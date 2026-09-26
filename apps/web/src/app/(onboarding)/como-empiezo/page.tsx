import { buildChecklist, type Checklist } from '@/onboarding/checklist';
import { LoadFailed } from '@/onboarding/ui/frame';
import { actions, column, link, note, page } from '@/onboarding/ui/onboarding.css';
import { requireSession } from '@/server/auth';
import { reportError } from '@/server/observability/report';
import { loadChecklistSignals } from '@/server/onboarding/load';

import { Camino, Cuenta, Hechos, PasosHero } from './pasos-ui';
import { section, sectionHead, sectionTitle } from './pasos.css';

/**
 * `/como-empiezo` — «Primeros pasos» (P-04's checklist as N-14 updates it;
 * redrawn by ADR-107 as a path with Don Cuentas pointing at the next step).
 * Every item is detected from data, so it flips by itself when the owner
 * does the thing. The re-run of the wizard (N-15) starts here too.
 */
export const dynamic = 'force-dynamic';

/** Leave for the portal, or re-run the wizard (N-15). */
function Salidas({ complete }: { readonly complete: boolean }) {
  return (
    <div className={actions}>
      {/* P-36 D-2: the portal comes back here until «Para vender» is done — unless the owner asks it not to. */}
      <a className={link} href={complete ? '/' : '/api/guia/omitir'}>
        Ir a mi portal
      </a>
      <a className={link} href="/bienvenida?modo=reconfigurar">
        Volver a configurar mi negocio
      </a>
    </div>
  );
}

function Guia({ c, pago }: { readonly c: Checklist; readonly pago?: string }) {
  return (
    <main className={page}>
      <div className={column}>
        {pago === 'listo' ? (
          <p role="status" className={note}>
            Guardamos tu plan. Ahora, lo que hace falta para vender:
          </p>
        ) : null}
        <PasosHero c={c} />
        <section className={section} aria-labelledby="para-vender">
          <div className={sectionHead}>
            <h2 id="para-vender" className={sectionTitle}>
              Para vender
            </h2>
            <Cuenta c={c} />
          </div>
          {c.complete ? (
            <Hechos items={c.required} />
          ) : (
            <Camino items={c.required} group="requerido" start={1} />
          )}
        </section>
        <section className={section} aria-labelledby="cuando-quieras">
          <h2 id="cuando-quieras" className={sectionTitle}>
            Cuando quieras
          </h2>
          <Camino items={c.optional} group="opcional" start={c.required.length + 1} />
        </section>
        <Salidas complete={c.complete} />
      </div>
    </main>
  );
}

export default async function ComoEmpiezoPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly pago?: string }>;
}) {
  const session = await requireSession();
  const { pago } = await searchParams;
  const signals = await loadChecklistSignals(session.business_id).catch((error: unknown) => {
    reportError(error, { endpoint: 'como-empiezo', businessId: session.business_id });
    return null;
  });
  if (signals === null) return <LoadFailed retry="/como-empiezo" />;
  const c = buildChecklist(signals);
  return <Guia c={c} pago={pago} />;
}
