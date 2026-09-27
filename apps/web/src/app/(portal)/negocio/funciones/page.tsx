import { parseFeatureFlags } from '@xangarro/domain';

import { requireSession } from '@/server/auth';
import { loadNegocio } from '@/server/screens';

import { FuncionesScreen } from './screen';

/**
 * Mi negocio · Funciones (P-15): the tenant's feature switches, gated by the
 * platform and the plan. **Reads Postgres.**
 */
export const dynamic = 'force-dynamic';

export default async function FuncionesPage() {
  const session = await requireSession();
  try {
    const business = await loadNegocio(session.business_id);
    return <FuncionesScreen flags={parseFeatureFlags(business?.featureFlags ?? '{}')} />;
  } catch {
    return <FuncionesScreen flags={null} />;
  }
}
