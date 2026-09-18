import { requireSession } from '@/server/auth';
import { loadNegocio } from '@/server/screens';

import { NegocioScreen } from './screen';

/**
 * Negocio — the business profile that feeds the statements and the receipts
 * (P-08), with Funciones (P-15) beneath it. **Reads Postgres.**
 */
export const dynamic = 'force-dynamic';

export default async function NegocioPage() {
  const session = await requireSession();
  try {
    return <NegocioScreen business={(await loadNegocio(session.business_id)) ?? null} />;
  } catch {
    return <NegocioScreen business={null} />;
  }
}
