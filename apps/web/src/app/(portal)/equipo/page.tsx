import { requireSession } from '@/server/auth';
import { portalOrigin } from '@/server/billing/origin';
import { loadEquipo } from '@/server/screens';

import { EquipoScreen } from './screen';

/** Tu equipo — operators and devices (P-05 + P-06). **Reads Postgres.** */
export const dynamic = 'force-dynamic';

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { tab } = await searchParams;
  const registerUrl = `${await portalOrigin()}/operador`;
  const initialTab = tab === 'dispositivos' ? 'dispositivos' : 'operadores';
  try {
    const data = await loadEquipo(session.business_id);
    return <EquipoScreen initialTab={initialTab} data={data} registerUrl={registerUrl} />;
  } catch {
    return <EquipoScreen initialTab={initialTab} data={null} registerUrl={registerUrl} />;
  }
}
