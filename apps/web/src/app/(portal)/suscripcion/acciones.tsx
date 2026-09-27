'use client';

import { useState, useTransition } from 'react';

import type { BillingInterval } from '@xangarro/application/billing';

import {
  administrarSuscripcion,
  iniciarPrueba,
  pagarAnualPorSpei,
  type BillingActionResult,
} from '@/server/billing/actions';

import { btn, errorTexto, lleno } from './suscripcion.css';

/**
 * The owner's billing buttons (P-10). Each asks the server for a Stripe URL
 * (Checkout or the Customer Portal) and sends the browser there; a refusal
 * shows its sentence. Rendered for the owner only; the actions check again.
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

export type EstiloBoton = keyof typeof btn;

export function BotonStripe(props: {
  readonly label: string;
  readonly accion: () => Promise<BillingActionResult>;
  readonly estilo?: EstiloBoton;
  readonly full?: boolean;
}) {
  const { error, pending, ir } = useIr();
  const clase = `${btn[props.estilo ?? 'secundario']}${props.full ? ` ${lleno}` : ''}`;
  return (
    <>
      <button type="button" className={clase} disabled={pending} onClick={() => ir(props.accion)}>
        {pending ? 'Abriendo…' : props.label}
      </button>
      {error === null ? null : (
        <p role="alert" className={errorTexto}>
          {error}
        </p>
      )}
    </>
  );
}

/** A plan card's CTA: a paid plan opens Checkout at the chosen interval; Xangarrito is a cancel, in the Portal. */
export const accionDePlan = (planId: string, interval: BillingInterval = 'month') =>
  planId === 'xangarrito' ? () => administrarSuscripcion() : () => iniciarPrueba(planId, interval);

/**
 * The annual plan by bank transfer (N-01, ADR-067): Stripe issues a CLABE on a
 * hosted invoice. Annual only: SPEI never pays a monthly plan.
 */
export const speiDePlan = (planId: string) => () => pagarAnualPorSpei(planId);
