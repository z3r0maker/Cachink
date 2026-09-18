'use client';

import { Banner, PendingButton, ScreenBody } from '@/components';
import { useSession } from '@/session/provider';
import type { SincronizacionData } from '@/server/screens';
import { canWrite, isOwner, resolveScreenState } from '@/session/gating';

import { HistorialCard } from './historial';
import { RechazosTable } from './rechazos';
import { Resumen } from './resumen';
import { pageSubtitle, pageTitle } from './sincronizacion.css';

/**
 * Sincronización (P-11): read-only sync health (ADR-058 §1) — refused rows,
 * per-device state and the recent history. Refused rows are never dropped;
 * resolving one is saved, and a refused retry reopens it.
 */
function Heading() {
  const session = useSession();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Sincronización</h1>
        <p className={pageSubtitle}>Qué falta por enviar</p>
      </div>
      {isOwner(session.role) ? (
        <div style={{ marginLeft: 'auto' }}>
          <PendingButton reason="La sincronización la inicia el dispositivo; el portal la observa.">
            Sincronizar ahora
          </PendingButton>
        </div>
      ) : null}
    </div>
  );
}

export function SincronizacionScreen({ data }: { readonly data: SincronizacionData | null }) {
  const mayWrite = canWrite(useSession().role);
  const rows = data?.rechazos ?? [];
  return (
    <>
      <Heading />
      {rows.length > 0 ? (
        <Banner
          tone="warning"
          title={`${rows.length} registros no se pudieron enviar.`}
          body="Siguen guardados en el dispositivo. Nada se pierde."
        />
      ) : null}
      <Resumen rows={rows} dispositivos={data?.dispositivos ?? []} />
      <ScreenBody
        state={resolveScreenState({ error: data === null, isEmpty: rows.length === 0 })}
        onRetry={() => window.location.reload()}
        empty={{
          title: 'Todo sincronizado',
          body: 'No hay registros pendientes. Tus números están completos.',
        }}
      >
        <RechazosTable rows={rows} mayWrite={mayWrite} />
      </ScreenBody>
      {data === null ? null : <HistorialCard eventos={data.historial} />}
    </>
  );
}
