import { SESSION } from '@/fixtures/business';
import { loadAsesor } from '@/server/screens';

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
    return <AsesorScreen insights={await loadAsesor(SESSION.businessId)} />;
  } catch {
    return <AsesorScreen insights={null} />;
  }
}
