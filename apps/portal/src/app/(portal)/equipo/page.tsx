import { SESSION } from '@/fixtures/business';
import { loadEquipo } from '@/server/screens';

import { EquipoScreen } from './screen';

/** Tu equipo — operators and devices (P-05 + P-06). **Reads Postgres.** */
export const dynamic = 'force-dynamic';

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === 'dispositivos' ? 'dispositivos' : 'operadores';
  try {
    return <EquipoScreen initialTab={initialTab} data={await loadEquipo(SESSION.businessId)} />;
  } catch {
    return <EquipoScreen initialTab={initialTab} data={null} />;
  }
}
