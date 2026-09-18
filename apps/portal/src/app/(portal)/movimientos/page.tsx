import { requireSession } from '@/server/auth';
import { loadMovimientos } from '@/server/screens';

import { MovimientosScreen } from './screen';

/**
 * Movimientos — the full ledger (P-09). **Reads Postgres.**
 *
 * Read-only: no "Nueva venta", no "Nuevo gasto", no "Cancelar". Those are phone
 * affordances — `sales` and `expenses` are UP tables with no down path
 * (ADR-058 §2).
 */
export const dynamic = 'force-dynamic';

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { tab } = await searchParams;
  const initialTab = tab === 'gastos' ? 'gastos' : 'ventas';
  try {
    const [ventas, gastos] = await Promise.all([
      loadMovimientos(session.business_id, 'venta'),
      loadMovimientos(session.business_id, 'gasto'),
    ]);
    return <MovimientosScreen initialTab={initialTab} ventas={ventas} gastos={gastos} />;
  } catch {
    return <MovimientosScreen initialTab={initialTab} ventas={null} gastos={null} />;
  }
}
