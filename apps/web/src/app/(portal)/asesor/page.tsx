import { currentSession } from '@/server/current-session';
import { loadAsesorPage } from '@/server/asesor';

import { AsesorScreen } from './screen';

/**
 * Asesor — Para ti, Metas and Diagnóstico (P-26, P-27, P-28).
 * **"Para ti" reads Postgres.**
 *
 * Para ti and Metas are deterministic and ship live; their footer reads
 * "Calculado a partir de tus registros", because deterministic output must not
 * claim AI authorship. Diagnóstico is LLM-backed, so production renders
 * «Próximamente» while locally it is live (ADR-059).
 */
export const dynamic = 'force-dynamic';

export default async function AsesorPage() {
  try {
    // The session carries the plan's Asesor cadencia; the loader materialises
    // only what that tier receives (ADR-059, ADR-087).
    const session = await currentSession();
    const data = await loadAsesorPage(session.businessId, session.capabilities.asesor);
    return <AsesorScreen data={data} />;
  } catch {
    return <AsesorScreen data={null} />;
  }
}
