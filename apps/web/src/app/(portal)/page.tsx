import { rangoDelMes } from '@xangarro/domain';

import { requireSession } from '@/server/auth';
import { hoy } from '@/server/clock';
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

export default async function InicioPage() {
  const session = await requireSession();
  // The business's today and its month — never a date pinned in code.
  const today = hoy();
  try {
    const mes = rangoDelMes(today);
    const data = await loadInicio(session.business_id, today, mes.desde, mes.hasta);
    return (
      <InicioScreen data={data} role={session.member_role} nombre={session.nombre} hoy={today} />
    );
  } catch {
    // The screen owns the error state; the container only decides which one.
    return (
      <InicioScreen data={null} role={session.member_role} nombre={session.nombre} hoy={today} />
    );
  }
}
