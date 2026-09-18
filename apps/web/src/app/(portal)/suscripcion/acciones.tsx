'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components';
import {
  administrarSuscripcion,
  iniciarPrueba,
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

/** A plan card's CTA: a paid plan opens Checkout; Xangarrito is a cancel, in the Portal. */
export const accionDePlan = (planId: string) =>
  planId === 'xangarrito' ? () => administrarSuscripcion() : () => iniciarPrueba(planId, 'month');
