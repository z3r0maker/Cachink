'use client';

import { ScreenBody } from '@/components';
import type { SincronizacionData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';
import { useSession } from '@/session/provider';

import { MiNegocioHead } from '../negocio/hub';
import { SyncHero } from './hero';
import { HistorialCard } from './historial';
import { PorRevisar } from './rechazos';
import { Cajas } from './resumen';
import * as s from './sincronizacion.css';
import { useRechazos } from './use-rechazos';

/**
 * Mi negocio · Sincronización (CfgSincronizacion, P-11): read-only sync health
 * (ADR-058 §1). The cajas send on their own, so there is no «Sincronizar
 * ahora»: the portal shows what is waiting for review, each caja and the
 * recent history. Refused rows are never dropped; resolving one is saved.
 */
function Contenido({ data }: { readonly data: SincronizacionData }) {
  const mayWrite = canWrite(useSession().role);
  const { abiertos, items, resolver, resueltos } = useRechazos(data.rechazos);
  return (
    <>
      <SyncHero
        pendientes={abiertos.length}
        cajas={data.dispositivos.filter((d) => d.revokedAt === null).length}
        mayWrite={mayWrite}
      />
      <div className={s.columnas}>
        <PorRevisar items={items} mayWrite={mayWrite} resolver={resolver} />
        <div className={s.columna}>
          <Cajas dispositivos={data.dispositivos} abiertos={abiertos} />
          <HistorialCard eventos={data.historial} resueltos={resueltos} />
        </div>
      </div>
    </>
  );
}

export function SincronizacionScreen({ data }: { readonly data: SincronizacionData | null }) {
  return (
    <>
      <MiNegocioHead activo="sincronizacion" />
      <ScreenBody
        state={resolveScreenState({ error: data === null })}
        onRetry={() => window.location.reload()}
      >
        {data === null ? null : <Contenido data={data} />}
      </ScreenBody>
    </>
  );
}
