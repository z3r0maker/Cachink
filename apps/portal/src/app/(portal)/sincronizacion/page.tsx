import { SESSION } from '@/fixtures/business';
import { loadSincronizacion } from '@/server/screens';

import { SincronizacionScreen } from './screen';

/**
 * Sincronización — what is still queued, and why anything was rejected (P-11).
 * **Reads Postgres.**
 *
 * There is no mode selector: the four cards in the design were mobile-era
 * strings, and a browser cannot be "solo este dispositivo" (ADR-058 §1).
 */
export const dynamic = 'force-dynamic';

export default async function SincronizacionPage() {
  try {
    return <SincronizacionScreen data={await loadSincronizacion(SESSION.businessId)} />;
  } catch {
    return <SincronizacionScreen data={null} />;
  }
}
