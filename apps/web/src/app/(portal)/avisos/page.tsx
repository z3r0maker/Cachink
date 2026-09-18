import { preferenciasDe } from '@xangarro/data-pg';
import { preferenciasEfectivas } from '@xangarro/domain';

import { requireSession } from '@/server/auth';
import { withTenant } from '@/server/db';
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
  const session = await requireSession();
  // The matrix degrades to the defaults if its read fails; the inbox owns the error state.
  const guardadas = await withTenant(session.business_id, (tx) =>
    preferenciasDe(tx, session.sub),
  ).catch(() => ({}));
  const preferencias = preferenciasEfectivas(guardadas);
  try {
    const rows = await loadAvisos(session.business_id);
    return <AvisosScreen rows={rows} preferencias={preferencias} />;
  } catch {
    return <AvisosScreen rows={null} preferencias={preferencias} />;
  }
}
