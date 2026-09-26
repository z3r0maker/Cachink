'use client';

import { useState } from 'react';

import { PLAN_LIMITS } from '@xangarro/domain';

import { ScreenBody, SegmentedTabs, UsageBar } from '@/components';
import { useSession } from '@/session/provider';
import type { EmpleadosData, EquipoData } from '@/server/screens';
import { emparejar } from '@/lib/personas';
import { canWrite, resolveScreenState } from '@/session/gating';

import { Operadores } from './cards';
import { Dispositivos } from './device-cards';
import { NuevoOperadorDialog } from './operador-dialogs';
import { KpisDispositivos, KpisOperadores } from './kpis';
import { Nomina } from '../empleados/screen';
import { PairingPanel } from './pairing-panel';
import { SoloNomina } from './persona-nomina';
import { pageSubtitle, pageTitle } from './equipo.css';

export type EquipoTab = 'personas' | 'cajas' | 'nomina';

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

/**
 * Each tab is empty on its own terms, so the copy is the tab's too (S-2):
 * a business with three operators and no phone yet is not "sin operadores".
 */
const VACIO = {
  operadores: {
    title: 'Crea tu primer operador',
    body: 'Tus operadores entran a la app con su nombre y su NIP. No necesitan correo.',
  },
  dispositivos: {
    title: 'Vincula tu primer dispositivo',
    body: 'Genera un código aquí arriba y escríbelo en el teléfono de tu operador. En cuanto se vincule, aparecerá en esta lista.',
  },
} as const;

/** Personas: everyone who cobra, with their payroll line, then payroll-only people. */
function Personas(props: {
  readonly data: EquipoData | null;
  readonly empleados: EmpleadosData | null;
  readonly c: ReturnType<typeof useCupos>;
}) {
  const { data, c } = props;
  const p = emparejar(data?.operadores ?? [], props.empleados ?? []);
  const vacio = p.conCaja.length === 0 && p.soloNomina.length === 0;
  return (
    <ScreenBody
      state={resolveScreenState({ error: data === null, isEmpty: vacio })}
      onRetry={() => window.location.reload()}
      empty={VACIO.operadores}
    >
      <Operadores personas={p.conCaja} />
      <SoloNomina
        empleados={p.soloNomina}
        mayWrite={c.mayWrite}
        lleno={c.activos >= c.limit}
        limit={c.limit}
      />
    </ScreenBody>
  );
}

/** Cajas: the pairing code for a writer, then every linked device. */
function Cajas(props: {
  readonly data: EquipoData | null;
  readonly c: ReturnType<typeof useCupos>;
  readonly registerUrl: string;
}) {
  const { data, c } = props;
  return (
    <>
      {c.mayWrite ? (
        <PairingPanel
          initial={data?.codigo ?? null}
          lleno={c.vinculados >= c.deviceLimit}
          limit={c.deviceLimit}
          registerUrl={props.registerUrl}
        />
      ) : null}
      <ScreenBody
        state={resolveScreenState({
          error: data === null,
          isEmpty: data?.dispositivos.length === 0,
        })}
        onRetry={() => window.location.reload()}
        empty={VACIO.dispositivos}
      >
        {data === null ? null : <Dispositivos rows={data.dispositivos} mayWrite={c.mayWrite} />}
      </ScreenBody>
    </>
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

function Encabezado(props: { readonly tab: string; readonly c: ReturnType<typeof useCupos> }) {
  const { c, tab } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Equipo y nómina</h1>
        <p className={pageSubtitle}>Quién trabaja contigo, quién cobra y cuánto le pagas</p>
      </div>
      {!c.mayWrite || tab === 'nomina' ? null : tab === 'personas' ? (
        <Quota activos={c.activos} limit={c.limit} />
      ) : (
        <DeviceQuota activos={c.vinculados} limit={c.deviceLimit} />
      )}
    </div>
  );
}

/** The tab's four tiles; nothing to count while the read is failing. */
function Kpis({
  data,
  isOperadores,
}: {
  readonly data: EquipoData | null;
  readonly isOperadores: boolean;
}) {
  if (data === null) return null;
  return isOperadores ? (
    <KpisOperadores rows={data.operadores} />
  ) : (
    <KpisDispositivos rows={data.dispositivos} />
  );
}

function Pestanas(props: {
  readonly tab: string;
  readonly onTab: (t: string) => void;
  readonly data: EquipoData | null;
  readonly empleados: EmpleadosData | null;
}) {
  const p = emparejar(props.data?.operadores ?? [], props.empleados ?? []);
  return (
    <SegmentedTabs
      ariaLabel="Equipo y nómina"
      value={props.tab}
      onValueChange={props.onTab}
      tabs={[
        { value: 'personas', label: 'Personas', count: p.conCaja.length + p.soloNomina.length },
        { value: 'cajas', label: 'Cajas', count: props.data?.dispositivos.length ?? 0 },
        { value: 'nomina', label: 'Nómina', count: props.empleados?.length ?? 0 },
      ]}
    />
  );
}

export function EquipoScreen(props: {
  readonly initialTab: EquipoTab;
  readonly data: EquipoData | null;
  readonly empleados: EmpleadosData | null;
  readonly registerUrl: string;
}) {
  const { data, empleados } = props;
  const [tab, setTab] = useState<string>(props.initialTab);
  const c = useCupos(data);
  return (
    <>
      <Encabezado tab={tab} c={c} />
      {tab === 'nomina' ? null : <Kpis data={data} isOperadores={tab === 'personas'} />}
      <Pestanas tab={tab} onTab={setTab} data={data} empleados={empleados} />
      {tab === 'personas' ? <Personas data={data} empleados={empleados} c={c} /> : null}
      {tab === 'cajas' ? <Cajas data={data} c={c} registerUrl={props.registerUrl} /> : null}
      {tab === 'nomina' ? <Nomina rows={empleados} /> : null}
    </>
  );
}
