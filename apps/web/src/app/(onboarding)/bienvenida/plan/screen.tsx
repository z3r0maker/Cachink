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
import { Stage } from '@/onboarding/ui/stage';
import { hint, question } from '@/onboarding/ui/stage.css';
import { TOTAL_STEPS } from '@/onboarding/wizard-steps';
import { actions, list, note, price, row, rowTitle, stack } from '@/onboarding/ui/onboarding.css';
import { probarGratis, seguirGratis } from '@/server/actions/onboarding';

export interface PlanScreenProps {
  readonly plan: PlanId;
  readonly headline: string;
  readonly pending: readonly PendingPaidAnswer[];
  /** P-36 D-1: the beta charges nobody, so the card note would promise the wrong thing. */
  readonly beta: boolean;
}

type Notice = {
  readonly tone: 'info' | 'critical';
  readonly title: string;
  readonly body?: string;
};

const SOON: Notice = {
  tone: 'info',
  title: 'Pronto podrás contratar este plan',
  body: 'Guardamos tu elección y te avisaremos. Mientras tanto, sigue gratis: no pierdes nada.',
};

/** P-36 D-1: the beta charges nobody; the choice is kept and the business is configured. */
const BETA: Notice = {
  tone: 'info',
  title: 'Durante la beta no cobramos',
  body: 'Guardamos tu elección y ya configuramos tu negocio. Sigue gratis; te avisamos cuando abramos los planes de pago.',
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
      setNotice(r.beta ? BETA : SOON);
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
  readonly beta: boolean;
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
      <p className={note}>
        {props.beta
          ? 'Durante la beta no cobramos.'
          : 'Pagas con tarjeta. Cambias o cancelas cuando quieras.'}
      </p>
    </>
  );
}

function Acciones(p: { readonly a: ReturnType<typeof usePlanActions>; readonly free: boolean }) {
  return (
    <div className={actions}>
      {p.free ? null : (
        <Button onClick={p.a.probar} disabled={p.a.pending}>
          Contratar este plan
        </Button>
      )}
      <Button
        variant={p.free ? 'primary' : 'secondary'}
        onClick={p.a.gratis}
        disabled={p.a.pending}
      >
        {p.free ? 'Empezar gratis' : 'Seguir gratis'}
      </Button>
    </div>
  );
}

export function PlanScreen({ plan, headline, pending, beta }: PlanScreenProps) {
  const [annual, setAnnual] = useState(false);
  const interval: Interval = annual ? 'anual' : 'mensual';
  const a = usePlanActions(plan, interval);
  const free = plan === 'xangarrito';
  return (
    <Stage
      fase="Tu plan ideal"
      paso="Último paso"
      done={TOTAL_STEPS}
      total={TOTAL_STEPS}
      don={{
        pose: 'celebrando',
        text: '¡Listo! Con lo que me contaste, este es el plan que te queda.',
      }}
    >
      <h1 className={question}>{headline}</h1>
      <p className={hint}>{planPitch(plan)}</p>
      <Card>
        <div className={stack}>
          {free ? null : <Price plan={plan} annual={annual} onAnnual={setAnnual} beta={beta} />}
          <Pending items={pending} />
          {a.notice ? <Banner {...a.notice} /> : null}
          <Acciones a={a} free={free} />
        </div>
      </Card>
    </Stage>
  );
}
