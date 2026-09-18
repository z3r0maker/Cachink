import { requireSession } from '@/server/auth';
import { loadInicio } from '@/server/inicio';

import { InicioScreen } from './_inicio/screen';

/**
 * Inicio — the director's morning glance (P-13).
 *
 * **Reads Postgres**, not fixtures. This is the container half of the split
 * ADR-058 §9 establishes: it resolves the request lifecycle, and `InicioScreen`
 * is a pure component over the result, so Fase 5's state sweep can still force
 * any state from props.
 *
 * Dynamic because it reads per-tenant rows behind RLS; there is nothing to
 * prerender.
 */
export const dynamic = 'force-dynamic';

const TODAY = '2026-05-12';
const MONTH_FROM = '2026-05-01';
const MONTH_TO = '2026-05-31';

export default async function InicioPage() {
  const session = await requireSession();
  try {
    const data = await loadInicio(session.business_id, TODAY, MONTH_FROM, MONTH_TO);
    return <InicioScreen data={data} role={session.member_role} />;
  } catch {
    // The screen owns the error state; the container only decides which one.
    return <InicioScreen data={null} role={session.member_role} />;
  }
}
