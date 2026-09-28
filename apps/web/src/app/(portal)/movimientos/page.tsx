import { requireSession } from '@/server/auth';
import { hoy } from '@/server/clock';
import { loadMovimientos } from '@/server/movimientos';

import { rangoDe } from './periodo';
import { MovimientosScreen } from './screen';
import { leerEstado, type ParamsMovimientos } from './url';

/**
 * Movimientos — the full ledger (P-09). **Reads Postgres.**
 *
 * Read-only: no "Nueva venta", no "Nuevo gasto", no "Cancelar". Those are phone
 * affordances — `sales` and `expenses` are UP tables with no down path
 * (ADR-058 §2).
 *
 * The filters live in the URL and the server answers for them: one page of
 * ten rows and the period's summary (DB2-QRY-02), never the whole history.
 */
export const dynamic = 'force-dynamic';

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<ParamsMovimientos>;
}) {
  const session = await requireSession();
  const estado = leerEstado(await searchParams);
  const today = hoy();
  const rango = rangoDe(estado.rango, today, { desde: estado.desde, hasta: estado.hasta });
  try {
    const vista = await loadMovimientos(
      session.business_id,
      estado.tab === 'gastos' ? 'gasto' : 'venta',
      { ...rango, clasificacion: estado.cat, buscar: estado.q },
      estado.pagina,
    );
    return <MovimientosScreen estado={estado} hoy={today} vista={vista} />;
  } catch {
    return <MovimientosScreen estado={estado} hoy={today} vista={null} />;
  }
}
