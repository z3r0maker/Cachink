'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components';
import type { BillingInterval } from '@xangarro/application/billing';

import {
  administrarSuscripcion,
  iniciarPrueba,
  pagarAnualPorSpei,
  type BillingActionResult,
} from '@/server/billing/actions';

/**
 * The owner's billing buttons (P-10). Each asks the server for a Stripe URL
 * (Checkout or the Customer Portal) and sends the browser there; a refusal
 * shows its sentence. Rendered for the owner only — the actions check again.
 */
function useIr() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ir = (accion: () => Promise<BillingActionResult>) =>
    startTransition(async () => {
      const r = await accion();
      if (!r.ok) return setError(r.message);
      window.location.assign(r.url);
    });
  return { error, pending, ir };
}

export function BotonStripe(props: {
  readonly label: string;
  readonly accion: () => Promise<BillingActionResult>;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'dark';
  readonly full?: boolean;
  readonly size?: 'sm' | 'md';
}) {
  const { error, pending, ir } = useIr();
  return (
    <>
      <Button
        variant={props.variant ?? 'secondary'}
        full={props.full}
        size={props.size}
        disabled={pending}
        onClick={() => ir(props.accion)}
      >
        {pending ? 'Abriendo…' : props.label}
      </Button>
      {error === null ? null : <p role="alert">{error}</p>}
    </>
  );
}

/** A plan card's CTA: a paid plan opens Checkout at the chosen interval; Xangarrito is a cancel, in the Portal. */
export const accionDePlan = (planId: string, interval: BillingInterval = 'month') =>
  planId === 'xangarrito' ? () => administrarSuscripcion() : () => iniciarPrueba(planId, interval);

/**
 * The annual plan by bank transfer (N-01, ADR-067): Stripe issues a CLABE on a
 * hosted invoice. Annual only — SPEI never pays a monthly plan.
 */
export const speiDePlan = (planId: string) => () => pagarAnualPorSpei(planId);
