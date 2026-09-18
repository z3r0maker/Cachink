import { SESSION } from '@/fixtures/business';
import { loadAvisos } from '@/server/screens';

import { AvisosScreen } from './screen';

/**
 * Avisos — the inbox, and how you want to be told (P-31, P-32).
 * **Reads Postgres.**
 *
 * Backed by the single `notices` table it shares with the Asesor feed
 * (ADR-060). This page renders `sistema` and `operacion`; the bell counts
 * unread across those two only.
 */
export const dynamic = 'force-dynamic';

export default async function AvisosPage() {
  try {
    return <AvisosScreen rows={await loadAvisos(SESSION.businessId)} />;
  } catch {
    return <AvisosScreen rows={null} />;
  }
}
