import { requireSession } from '@/server/auth';
import { loadSuscripcion } from '@/server/suscripcion';

import { SuscripcionScreen } from './screen';

/**
 * Suscripción — the plan, the consumption and the receipts (P-10).
 *
 * The pricing is **real**: every pitch, price, CTA and feature line is
 * transcribed verbatim from the design, not paraphrased (ADR-059). The status,
 * the consumption and the entitlement are read from the business's rows.
 */
export const dynamic = 'force-dynamic';

export default async function SuscripcionPage() {
  const session = await requireSession();
  const data = await loadSuscripcion(session.business_id).catch(() => null);
  return <SuscripcionScreen data={data} />;
}
