'use client';

import { useState } from 'react';

import { PLAN_LIMITS } from '@xangarro/domain';

import { ScreenBody, SegmentedTabs, UsageBar } from '@/components';
import { useSession } from '@/session/provider';
import type { EquipoData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';

import { Dispositivos, Operadores } from './cards';
import { NuevoOperadorDialog } from './operador-dialogs';
import { PairingPanel } from './pairing-panel';
import { pageSubtitle, pageTitle } from './equipo.css';

export type EquipoTab = 'operadores' | 'dispositivos';

/**
 * The operator allowance. The number comes from the plan (`PLAN_LIMITS`), not a
 * constant here — the old `OPERATOR_LIMIT = 2` was a second copy of the
 * Xangarro limit, which would have kept saying 2 on every other plan.
 */
function Quota({ activos, limit }: { readonly activos: number; readonly limit: number }) {
  return (
    <div style={{ marginLeft: 'auto', minWidth: 220 }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>
        {activos} de {limit} operadores
      </div>
      <UsageBar used={activos} limit={limit} label="Operadores usados" />
      <div style={{ marginTop: 10 }}>
        <NuevoOperadorDialog disabled={activos >= limit} limit={limit} />
      </div>
    </div>
  );
}

/**
 * The device allowance (P-06), from the plan like the operators'. Full means a
 * new phone would be refused at activation, so the pairing panel says so
 * before anyone types a code.
 */
function DeviceQuota({ activos, limit }: { readonly activos: number; readonly limit: number }) {
  return (
    <div style={{ marginLeft: 'auto', minWidth: 220 }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>
        {activos} de {limit} dispositivos
      </div>
      <UsageBar used={activos} limit={limit} label="Dispositivos usados" />
    </div>
  );
}

function Body({
  data,
  isOperadores,
  mayWrite,
}: {
  readonly data: EquipoData | null;
  readonly isOperadores: boolean;
  readonly mayWrite: boolean;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({ error: data === null })}
      onRetry={() => window.location.reload()}
      empty={{
        title: 'Crea tu primer operador',
        body: 'Tus operadores entran a la app con su nombre y su NIP. No necesitan correo.',
      }}
    >
      {data === null ? null : isOperadores ? (
        <Operadores rows={data.operadores} />
      ) : (
        <Dispositivos rows={data.dispositivos} mayWrite={mayWrite} />
      )}
    </ScreenBody>
  );
}

/** What the plan allows and what is in use: active operators, linked devices. */
function useCupos(data: EquipoData | null) {
  const session = useSession();
  return {
    mayWrite: canWrite(session.role),
    // Active operators only: a deactivated one no longer spends the allowance.
    activos: data?.operadores.filter((o) => o.active).length ?? 0,
    limit: PLAN_LIMITS[session.planId].operators,
    deviceLimit: PLAN_LIMITS[session.planId].devices,
    vinculados: data?.dispositivos.filter((d) => d.revokedAt === null).length ?? 0,
  };
}

function Encabezado(props: {
  readonly isOperadores: boolean;
  readonly c: ReturnType<typeof useCupos>;
}) {
  const { c, isOperadores } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Tu equipo</h1>
        <p className={pageSubtitle}>Quién captura, desde qué dispositivo y qué tan al día está</p>
      </div>
      {!c.mayWrite ? null : isOperadores ? (
        <Quota activos={c.activos} limit={c.limit} />
      ) : (
        <DeviceQuota activos={c.vinculados} limit={c.deviceLimit} />
      )}
    </div>
  );
}

export function EquipoScreen({
  initialTab,
  data,
}: {
  readonly initialTab: EquipoTab;
  readonly data: EquipoData | null;
}) {
  const [tab, setTab] = useState<string>(initialTab);
  const isOperadores = tab === 'operadores';
  const c = useCupos(data);
  const { mayWrite, activos, deviceLimit, vinculados } = c;

  return (
    <>
      <Encabezado isOperadores={isOperadores} c={c} />
      <SegmentedTabs
        ariaLabel="Tu equipo"
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'operadores', label: 'Operadores', count: activos },
          { value: 'dispositivos', label: 'Dispositivos', count: data?.dispositivos.length ?? 0 },
        ]}
      />
      {!isOperadores && mayWrite ? (
        <PairingPanel
          initial={data?.codigo ?? null}
          lleno={vinculados >= deviceLimit}
          limit={deviceLimit}
        />
      ) : null}
      <Body data={data} isOperadores={isOperadores} mayWrite={mayWrite} />
    </>
  );
}
