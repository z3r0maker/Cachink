import { SESSION } from '@/fixtures/business';
import { loadEstadosModel } from '@/server/estados';

import { EstadosScreen } from './screen';

/**
 * Estados financieros — NIF B-3, B-6 and B-2 plus indicators (P-14).
 * **Computed from real ledger rows.**
 *
 * The figures come from the **existing** `@xangarro/domain` functions, the same
 * code the phone runs; `tests/estados.test.ts` recomputes and asserts identity,
 * so a reimplementation inside a component fails CI.
 *
 * Xangarrito does not include NIF statements and sees `locked` (ADR-059).
 */
export const dynamic = 'force-dynamic';

export default async function EstadosPage() {
  try {
    const model = await loadEstadosModel(SESSION.businessId, '2026-05-01', '2026-05-31');
    return <EstadosScreen model={model} />;
  } catch {
    return <EstadosScreen model={null} />;
  }
}
