import { requireSession } from '@/server/auth';
import { loadEmpleados } from '@/server/screens';

import { EmpleadosScreen } from './screen';

/**
 * Empleados — who works with you and what you pay them (P-12).
 * **Reads Postgres.**
 *
 * Two tabs, not three: Asistencia is cut because nothing produces attendance
 * data (ADR-058 §5). Nómina is a read-only grouping of nómina-category gastos,
 * which the phone captures.
 */
export const dynamic = 'force-dynamic';

export default async function EmpleadosPage() {
  const session = await requireSession();
  try {
    return <EmpleadosScreen rows={await loadEmpleados(session.business_id)} />;
  } catch {
    return <EmpleadosScreen rows={null} />;
  }
}
