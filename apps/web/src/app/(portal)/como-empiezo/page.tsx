import { Banner } from '@/components';
import { buildChecklist, type Checklist } from '@/onboarding/checklist';
import { actions, link, note } from '@/onboarding/ui/onboarding.css';
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
 *
 * It lives inside the portal shell: both onboarding paths end here, so a new
 * owner lands on what to do next and can still move anywhere from the
 * sidebar. Nothing redirects back to it — the sidebar card and Inicio's
 * briefing point here until the steps are done.
 */
export const dynamic = 'force-dynamic';

/** Re-run the wizard (N-15). */
function Salidas() {
  return (
    <div className={actions}>
      <a className={link} href="/bienvenida?modo=reconfigurar">
        Volver a configurar mi negocio
      </a>
    </div>
  );
}

function Guia({ c, pago }: { readonly c: Checklist; readonly pago?: string }) {
  return (
    <>
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
      <Salidas />
    </>
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
  if (signals === null) {
    return (
      <Banner
        tone="critical"
        title="No pudimos cargar tus primeros pasos."
        body="Tus datos están a salvo."
        action={
          <a className={link} href="/como-empiezo">
            Reintentar
          </a>
        }
      />
    );
  }
  const c = buildChecklist(signals);
  return <Guia c={c} pago={pago} />;
}
