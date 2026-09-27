import { requireSession } from '@/server/auth';
import { loadNegocio } from '@/server/screens';

import { CobrosScreen } from './screen';

/**
 * Mi negocio · Cobros: Efectivo, Tarjeta, Transferencia and Fiado, the ways
 * the caja offers to get paid (P-08). **Reads Postgres.**
 */
export const dynamic = 'force-dynamic';

export default async function CobrosPage() {
  const session = await requireSession();
  try {
    const business = await loadNegocio(session.business_id);
    return <CobrosScreen business={business ?? null} failed={false} />;
  } catch {
    return <CobrosScreen business={null} failed />;
  }
}
