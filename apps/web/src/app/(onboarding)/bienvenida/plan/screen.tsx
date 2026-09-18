'use client';

import type { PendingPaidAnswer, PlanId } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Button, Card, Switch, Tag } from '@/components';
import {
  PENDING_ANSWER_COPY,
  planName,
  planPitch,
  priceLabel,
  type Interval,
} from '@/onboarding/plan-copy';
import { OnboardingFrame } from '@/onboarding/ui/frame';
import { actions, list, note, price, row, rowTitle, stack } from '@/onboarding/ui/onboarding.css';
import { probarGratis, seguirGratis } from '@/server/actions/onboarding';

export interface PlanScreenProps {
  readonly plan: PlanId;
  readonly headline: string;
  readonly pending: readonly PendingPaidAnswer[];
}

type Notice = {
  readonly tone: 'info' | 'critical';
  readonly title: string;
  readonly body?: string;
};

const SOON: Notice = {
  tone: 'info',
  title: 'Pronto podrás activar tu prueba',
  body: 'Guardamos tu elección y te avisaremos. Mientras tanto, sigue gratis: no pierdes nada.',
};

function usePlanActions(plan: PlanId, interval: Interval) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const probar = () =>
    startTransition(async () => {
      const r = await probarGratis(plan, interval);
      if (!r.ok) return setNotice({ tone: 'critical', title: r.message });
      if (r.redirect !== null) return window.location.assign(r.redirect);
      setNotice(SOON);
    });
  const gratis = () =>
    startTransition(async () => {
      const r = await seguirGratis();
      if (!r.ok) return setNotice({ tone: 'critical', title: r.message });
      router.push('/como-empiezo');
    });
  return { notice, pending, probar, gratis };
}

function Pending({ items }: { readonly items: readonly PendingPaidAnswer[] }) {
  if (items.length === 0) return null;
  return (
    <ul className={list} aria-label="Lo que pediste y viene en un plan de pago">
      {items.map((p) => (
        <li key={p.answer} className={row}>
          <span className={rowTitle}>{PENDING_ANSWER_COPY[p.answer] ?? p.answer}</span>
          <Tag tone="warning">Incluido en {planName(p.includedIn)}</Tag>
        </li>
      ))}
    </ul>
  );
}

/** Price with the annual toggle; every figure is "+ IVA" (ADR-067). */
function Price(props: {
  readonly plan: PlanId;
  readonly annual: boolean;
  readonly onAnnual: (on: boolean) => void;
}) {
  return (
    <>
      <label className={row}>
        <Switch checked={props.annual} onCheckedChange={props.onAnnual} label="Pago anual" />
        <span className={note}>Pago anual: 12 meses por el precio de 10</span>
      </label>
      <span className={price} data-testid="plan-price">
        {priceLabel(props.plan, props.annual ? 'anual' : 'mensual')}
      </span>
      <p className={note}>14 días gratis. Sin tarjeta para empezar.</p>
    </>
  );
}

export function PlanScreen({ plan, headline, pending }: PlanScreenProps) {
  const [annual, setAnnual] = useState(false);
  const interval: Interval = annual ? 'anual' : 'mensual';
  const a = usePlanActions(plan, interval);
  const free = plan === 'xangarrito';
  return (
    <OnboardingFrame title={headline} subtitle={planPitch(plan)}>
      <Card>
        <div className={stack}>
          {free ? null : <Price plan={plan} annual={annual} onAnnual={setAnnual} />}
          <Pending items={pending} />
          {a.notice ? <Banner {...a.notice} /> : null}
          <div className={actions}>
            {free ? null : (
              <Button onClick={a.probar} disabled={a.pending}>
                Probar 14 días
              </Button>
            )}
            <Button
              variant={free ? 'primary' : 'secondary'}
              onClick={a.gratis}
              disabled={a.pending}
            >
              {free ? 'Empezar gratis' : 'Seguir gratis'}
            </Button>
          </div>
        </div>
      </Card>
    </OnboardingFrame>
  );
}
