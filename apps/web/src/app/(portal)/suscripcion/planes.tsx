'use client';

import { useState } from 'react';
import type { BillingInterval } from '@xangarro/application/billing';

import { SegmentedTabs } from '@/components';
import { PLAN_CARDS } from '@/data/planes';
import { useSession } from '@/session/provider';

import { accionDePlan, speiDePlan } from './acciones';
import { PlanCard } from './plan-card';
import { planGrid } from './suscripcion.css';

const INTERVALOS = [
  { value: 'month', label: 'Mensual' },
  { value: 'year', label: 'Anual — 2 meses gratis' },
];

/** The plan cards, monthly or annual (N-01); SPEI is offered on annual only. */
export function Planes({ owner }: { readonly owner: boolean }) {
  const session = useSession();
  const [interval, setInterval] = useState<BillingInterval>('month');
  const vende = (id: string) => owner && id !== session.planId;
  return (
    <div id="planes">
      <SegmentedTabs
        ariaLabel="Periodo de pago"
        tabs={INTERVALOS}
        value={interval}
        onValueChange={(v) => setInterval(v === 'year' ? 'year' : 'month')}
      />
      <div className={planGrid} style={{ marginTop: 16 }}>
        {PLAN_CARDS.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            interval={interval}
            current={p.id === session.planId}
            accion={vende(p.id) ? accionDePlan(p.id, interval) : null}
            spei={
              vende(p.id) && interval === 'year' && p.id !== 'xangarrito' ? speiDePlan(p.id) : null
            }
          />
        ))}
      </div>
    </div>
  );
}
