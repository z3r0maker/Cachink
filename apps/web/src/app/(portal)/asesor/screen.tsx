'use client';

import { useState } from 'react';

import { ScreenBody, SegmentedTabs, Tag } from '@/components';
import { useSession } from '@/session/provider';
import { asesorShowsDiagnostico, resolveScreenState } from '@/session/gating';

import type { AsesorPageData } from '@/server/asesor';
import type { MetasPageData } from '@/server/metas';
import type { Role } from '@/session/types';

import { Metas } from './metas';
import { Anteriores, Capacidades, ParaTi } from './para-ti';
import { CompartirDiagnostico } from './compartir-diagnostico';
import { pageSubtitle, pageTitle } from './asesor.css';

/**
 * Whether the model-backed surfaces are live.
 *
 * **Locally nothing is gated; in production every LLM-backed path renders
 * «Próximamente»** (ADR-059). One flag, checked at one boundary.
 */
const LLM_ENABLED = process.env.NODE_ENV !== 'production';

const TABS = [
  { value: 'parati', label: 'Para ti' },
  { value: 'metas', label: 'Metas' },
  { value: 'diagnostico', label: 'Diagnóstico' },
];

function Heading() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Asesor</h1>
        <p className={pageSubtitle}>Lo que tus números te están diciendo</p>
      </div>
      <span style={{ marginLeft: 'auto' }}>
        <Tag tone="soft">Asesor</Tag>
      </span>
    </div>
  );
}

function Diagnostico() {
  const session = useSession();
  return (
    <>
      <ScreenBody
        state={resolveScreenState({
          entitled: asesorShowsDiagnostico(session.capabilities),
          llmBacked: true,
          llmEnabled: LLM_ENABLED,
        })}
        onRetry={() => undefined}
        /* No `empty` yet: "necesita 90 días de registros" is the model's own
           precondition, and the model is still behind `proximamente`. The copy
           ships with the rule that can reach it, not before (S-2). */
        locked={{
          title: 'El Diagnóstico llega con Xangarrote',
          body: 'Cada mes, una lectura completa de tu negocio y un plan para tu meta.',
          plan: 'Xangarrote',
        }}
        proximamente={{
          title: 'El Diagnóstico llega pronto',
          body: 'Estamos afinando la lectura mensual de tu negocio. Mientras tanto, tu Asesor sigue avisándote cada día en «Para ti».',
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
}: {
  readonly data: AsesorPageData | null;
  readonly metas: MetasPageData | null;
  readonly role: Role;
}) {
  const [tab, setTab] = useState('parati');

  return (
    <>
      <Heading />
      <SegmentedTabs ariaLabel="Asesor" value={tab} onValueChange={setTab} tabs={TABS} />
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
