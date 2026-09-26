import { hoy } from '@/server/clock';
import { requireSession } from '@/server/auth';
import { portalOrigin } from '@/server/billing/origin';
import { loadEmpleados, loadEquipo } from '@/server/screens';

import { EquipoScreen, type EquipoTab } from './screen';

/**
 * Equipo y nómina (ADR-107) — the people (who cobra at a caja, who is on
 * payroll, usually both), the cajas (P-06) and the nómina (P-12), where Tu
 * equipo and Empleados used to be two pages. **Reads Postgres.**
 */
export const dynamic = 'force-dynamic';

/** `?tab=dispositivos` is the old name of Cajas; links out there still use it. */
function tabDe(tab: string | undefined): EquipoTab {
  if (tab === 'cajas' || tab === 'dispositivos') return 'cajas';
  return tab === 'nomina' ? 'nomina' : 'personas';
}

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const initialTab = tabDe((await searchParams).tab);
  const registerUrl = `${await portalOrigin()}/operador`;
  const [data, empleados] = await Promise.all([
    loadEquipo(session.business_id, hoy()).catch(() => null),
    loadEmpleados(session.business_id).catch(() => null),
  ]);
  return (
    <EquipoScreen
      initialTab={initialTab}
      data={data}
      empleados={empleados}
      registerUrl={registerUrl}
    />
  );
}
