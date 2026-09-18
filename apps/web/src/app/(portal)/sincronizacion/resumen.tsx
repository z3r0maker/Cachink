'use client';

import { formatFechaHora } from '@xangarro/domain';

import { Card, KpiCard, StatusPill, kpiGrid } from '@/components';
import type { SincronizacionData } from '@/server/screens';

/**
 * The summary tiles and one card per device. A device with refused rows says
 * so; the others are «Al día». Times are on the business's clock.
 */
type Rejection = SincronizacionData['rechazos'][number];

export function Resumen({
  rows,
  dispositivos,
}: {
  readonly rows: readonly Rejection[];
  readonly dispositivos: SincronizacionData['dispositivos'];
}) {
  const conRechazos = new Set(rows.map((r) => r.deviceId));
  return (
    <>
      <div className={kpiGrid}>
        <KpiCard
          label="Registros rechazados"
          value={`${rows.length}`}
          tone={rows.length > 0 ? 'warning' : 'neutral'}
          hint="Esperando revisión"
        />
        <KpiCard label="Dispositivos conectados" value={`${dispositivos.length}`} />
      </div>
      <div className={kpiGrid}>
        {dispositivos.map((d) => (
          <Card key={d.id}>
            <strong>{d.nombre}</strong>
            <div style={{ marginTop: 8 }}>
              {conRechazos.has(d.id) ? (
                <StatusPill tone="warning">Con registros rechazados</StatusPill>
              ) : (
                <StatusPill tone="success">Al día</StatusPill>
              )}
            </div>
            <p style={{ marginTop: 10, color: 'var(--text-muted)' }}>
              Última sincronización: {formatFechaHora(d.lastPushAt)}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
