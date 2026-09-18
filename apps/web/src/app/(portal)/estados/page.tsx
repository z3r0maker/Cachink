import { requireSession } from '@/server/auth';
import { hoy } from '@/server/clock';
import { loadEstadosModel } from '@/server/estados';

import { periodoDe } from './periodo';
import { EstadosScreen } from './screen';

/**
 * Estados financieros — NIF B-3, B-6 and B-2 plus indicators (P-14).
 * **Computed from real ledger rows** for the period in the URL (Mensual by
 * default), at the ISR rate the owner set in Negocio.
 *
 * The figures come from the **existing** `@xangarro/domain` functions, the same
 * code the phone runs; `tests/estados.test.ts` recomputes and asserts identity,
 * so a reimplementation inside a component fails CI.
 *
 * Xangarrito does not include NIF statements and sees `locked` (ADR-059).
 */
export const dynamic = 'force-dynamic';

export default async function EstadosPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ p?: string; desde?: string; hasta?: string }>;
}) {
  const session = await requireSession();
  const periodo = periodoDe(hoy(), await searchParams);
  try {
    const { desde, hasta } = periodo.rango;
    const model = await loadEstadosModel(session.business_id, desde, hasta);
    return <EstadosScreen model={model} periodo={periodo} />;
  } catch {
    return <EstadosScreen model={null} periodo={periodo} />;
  }
}
