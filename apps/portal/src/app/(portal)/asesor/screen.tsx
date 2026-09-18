'use client';

import { useState } from 'react';

import { ScreenBody, SegmentedTabs, Tag } from '@/components';
import { SESSION } from '@/fixtures/business';
import { asesorShowsDiagnostico, resolveScreenState } from '@/session/gating';

import type { AvisosData } from '@/server/screens';

import { Metas } from './metas';
import { Anteriores, Capacidades, ParaTi } from './para-ti';
import { pageSubtitle, pageTitle } from './asesor.css';

/**
 * Whether the model-backed surfaces are live.
 *
 * **Locally nothing is gated; in production every LLM-backed path renders
 * «Próximamente»** (ADR-059). One flag, checked at one boundary.
 */
const LLM_ENABLED = process.env.NODE_ENV !== 'production';

type AsesorInsights = AvisosData;

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
  return (
    <ScreenBody
      state={resolveScreenState({
        entitled: asesorShowsDiagnostico(SESSION.capabilities),
        llmBacked: true,
        llmEnabled: LLM_ENABLED,
      })}
      onRetry={() => undefined}
      empty={{
        title: 'Sin datos suficientes',
        body: 'Tu Diagnóstico necesita 90 días de registros.',
      }}
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
  );
}

export function AsesorScreen({ insights }: { readonly insights: AsesorInsights | null }) {
  const [tab, setTab] = useState('parati');

  return (
    <>
      <Heading />
      <SegmentedTabs ariaLabel="Asesor" value={tab} onValueChange={setTab} tabs={TABS} />
      {tab === 'parati' ? (
        <>
          <ParaTi insights={insights} />
          <Capacidades />
          <Anteriores />
        </>
      ) : null}
      {tab === 'metas' ? <Metas /> : null}
      {tab === 'diagnostico' ? <Diagnostico /> : null}
    </>
  );
}
