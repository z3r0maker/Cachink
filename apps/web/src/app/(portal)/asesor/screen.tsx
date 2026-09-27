'use client';

import { useState } from 'react';

import { DON_CUENTAS, ScreenBody, SegmentedTabs } from '@/components';
import { useSession } from '@/session/provider';
import { asesorShowsDiagnostico, resolveScreenState } from '@/session/gating';

import type { AsesorPageData } from '@/server/asesor';
import type { MetasPageData } from '@/server/metas';
import type { Role } from '@/session/types';

import { Metas } from './metas';
import { Anteriores, Capacidades, ParaTi } from './para-ti';
import { CompartirDiagnostico } from './compartir-diagnostico';
import { DonHero } from './hero';

const TABS = [
  { value: 'parati', label: 'Para ti' },
  { value: 'metas', label: 'Metas' },
  { value: 'diagnostico', label: 'Diagnóstico' },
];

function Diagnostico() {
  const session = useSession();
  return (
    <>
      <ScreenBody
        state={resolveScreenState({
          entitled: asesorShowsDiagnostico(session.capabilities),
          llmBacked: true,
          // The `asesorLlm` kill switch (N-09): off in production until staff turn
          // it on in the console's /flags; on locally (`platformDefaults`).
          llmEnabled: session.platform.asesorLlm,
        })}
        onRetry={() => undefined}
        /* No `empty` yet: "necesita 90 días de registros" is the model's own
           precondition, and the model is still behind `proximamente`. The copy
           ships with the rule that can reach it, not before (S-2). */
        /* ADR-109 §3: this card is Xangarrito's now, and it names Xangarro —
           the cheapest plan that reads a Diagnóstico. Xangarro's own report is
           the teased one (ADR-112), which is not a locked state. */
        locked={{
          title: 'El Diagnóstico llega con Xangarro',
          body: 'Cada mes, una lectura escrita de tu negocio y el primer movimiento para tu meta.',
          plan: 'Xangarro',
        }}
        proximamente={{
          title: 'El Diagnóstico llega pronto',
          body: 'Estamos afinando la lectura mensual de tu negocio. Mientras tanto, Don Cuentas sigue avisándote cada día en «Para ti».',
        }}
      >
        <p>Reporte completo del mes.</p>
      </ScreenBody>
      {/* Sharing the month's real figures is arithmetic, not the model's
        report, so the trigger stands outside the «Próximamente» gate. */}
      <CompartirDiagnostico />
    </>
  );
}

export function AsesorScreen({
  data,
  metas,
  role,
  hoy,
}: {
  readonly data: AsesorPageData | null;
  readonly metas: MetasPageData | null;
  readonly role: Role;
  /** The server's today (`YYYY-MM-DD`), so the hero's date matches the feed's. */
  readonly hoy: string;
}) {
  const [tab, setTab] = useState('parati');

  return (
    <>
      <DonHero pendientes={data?.feed.length ?? 0} hoy={hoy} />
      <SegmentedTabs ariaLabel={DON_CUENTAS} value={tab} onValueChange={setTab} tabs={TABS} />
      {tab === 'parati' ? (
        <>
          <ParaTi insights={data?.feed ?? null} />
          <Capacidades capacidades={data?.capacidades ?? []} />
          <Anteriores anteriores={data?.anteriores ?? []} />
        </>
      ) : null}
      {tab === 'metas' ? <Metas data={metas} role={role} /> : null}
      {tab === 'diagnostico' ? <Diagnostico /> : null}
    </>
  );
}
