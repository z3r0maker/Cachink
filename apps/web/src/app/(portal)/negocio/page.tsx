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
    // No row and a failed read are different screens (S-2): the first is a
    // profile nobody has filled in yet, the second is a database we could not
    // reach. Collapsing both to `null` made the empty state unreachable.
    const business = await loadNegocio(session.business_id);
    return <NegocioScreen business={business ?? null} failed={false} />;
  } catch {
    return <NegocioScreen business={null} failed />;
  }
}
