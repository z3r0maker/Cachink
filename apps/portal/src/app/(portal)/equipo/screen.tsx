'use client';

import { useState } from 'react';

import { Button, ScreenBody, SegmentedTabs, UsageBar } from '@/components';
import { useSession } from '@/session/provider';
import type { EquipoData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';

import { Dispositivos, Operadores } from './cards';
import { PairingPanel } from './pairing-panel';
import { pageSubtitle, pageTitle } from './equipo.css';

export type EquipoTab = 'operadores' | 'dispositivos';

/** Xangarro includes 2 operators; the counter and the disabled CTA say so. */
const OPERATOR_LIMIT = 2;

function Quota({ activos }: { readonly activos: number }) {
  return (
    <div style={{ marginLeft: 'auto', minWidth: 220 }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>
        {activos} de {OPERATOR_LIMIT} operadores
      </div>
      <UsageBar used={activos} limit={OPERATOR_LIMIT} label="Operadores usados" />
      <div style={{ marginTop: 10 }}>
        {/* Disabled rather than hidden: the limit is the message. */}
        <Button disabled={activos >= OPERATOR_LIMIT} title="Tu plan incluye 2 operadores">
          Nuevo operador
        </Button>
      </div>
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
        body: 'Tus operadores entran a la app con su nombre y su PIN. No necesitan correo.',
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

export function EquipoScreen({
  initialTab,
  data,
}: {
  readonly initialTab: EquipoTab;
  readonly data: EquipoData | null;
}) {
  const session = useSession();
  const [tab, setTab] = useState<string>(initialTab);
  const isOperadores = tab === 'operadores';
  const mayWrite = canWrite(session.role);
  const activos = data?.operadores.length ?? 0;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className={pageTitle}>Tu equipo</h1>
          <p className={pageSubtitle}>Quién captura, desde qué dispositivo y qué tan al día está</p>
        </div>
        {mayWrite && isOperadores ? <Quota activos={activos} /> : null}
      </div>
      <SegmentedTabs
        ariaLabel="Tu equipo"
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'operadores', label: 'Operadores', count: activos },
          { value: 'dispositivos', label: 'Dispositivos', count: data?.dispositivos.length ?? 0 },
        ]}
      />
      {!isOperadores && mayWrite ? <PairingPanel initial={data?.codigo ?? null} /> : null}
      <Body data={data} isOperadores={isOperadores} mayWrite={mayWrite} />
    </>
  );
}
