import { CapacityCard } from '@/components/capacity-card';
import { DonNote } from '@/components/don-cuentas/don-cuentas';
import { formatMetric } from '@/server/capacity/labels';
import { snapshotOf } from '@/server/capacity/port';
import { capacityMetrics, worstStatus } from '@/server/capacity/status';
import { requireStaffPage } from '@/server/staff';
import { capacityNow } from '@/server/torre/readings';
import * as u from '@/styles/torre.css';

/** Measured on every visit: capacity must never be a cached number. */
export const dynamic = 'force-dynamic';

export default async function CapacidadPage() {
  await requireStaffPage();
  const reading = await capacityNow();
  const metrics = reading === null ? null : capacityMetrics(snapshotOf(reading));
  const worst = metrics === null ? null : worstStatus(metrics);
  const size = metrics?.find((m) => m.key === 'dbSizeS2');
  return (
    <div className={u.page}>
      <header className={u.pageHead}>
        <div>
          <span className={u.eyebrow}>
            ADR-068 · S2 particionar o réplica · S3 modelo analítico
          </span>
          <h1 className={u.title}>Capacidad</h1>
        </div>
      </header>
      {worst === null ? (
        <DonNote mood="alarma">
          No pude medir la base de datos. Si la consola abre, la base responde; revisa los permisos
          del rol de la consola.
        </DonNote>
      ) : worst === 'red' ? (
        <DonNote mood="alarma">
          Un umbral ya se cruzó. Toca planear el cambio de S2 o S3 que dice ADR-068.
        </DonNote>
      ) : worst === 'amber' ? (
        <DonNote mood="guardia">Algo va arriba del 80 % de su umbral. Todavía hay margen.</DonNote>
      ) : (
        <DonNote mood="tranquilo">
          La base pesa {formatMetric('dbSizeS2', size?.value ?? null)} de{' '}
          {formatMetric('dbSizeS2', size?.trigger ?? null)}. Revisamos el mes que entra.
        </DonNote>
      )}
      <CapacityCard reading={reading} />
    </div>
  );
}
